import { asc, eq, sql, type InferSelectModel } from "drizzle-orm";

import { db } from "@/db";
import {
  accommodation,
  auditLog,
  block,
  occupancy,
} from "@/db/schema";
import { pgError } from "@/lib/services/reservation";

export type Block = InferSelectModel<typeof block>;

export class BlockConflictError extends Error {
  constructor(
    public readonly reason: "OVERLAP" | "NOT_FOUND",
    message?: string,
  ) {
    super(message ?? reason);
    this.name = "BlockConflictError";
  }
}

/**
 * Cria um bloqueio de datas (transacional). Ocupa o mesmo ledger `occupancy` (source='BLOCK') e
 * passa pela EXCLUDE constraint — sobreposição com reserva/bloqueio ativo → OVERLAP (409).
 */
export async function createBlock(input: {
  accommodationId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  adminId?: string | null;
}): Promise<Block> {
  try {
    return await db.transaction(async (tx) => {
      const accRows = await tx.execute<{ is_active: boolean }>(sql`
        SELECT is_active FROM ${accommodation}
        WHERE id = ${input.accommodationId} AND deleted_at IS NULL FOR UPDATE`);
      if (!accRows[0]) {
        throw new BlockConflictError("NOT_FOUND", "Acomodação não encontrada.");
      }

      // expire-on-write: libera holds vencidos que colidem antes de bloquear.
      await tx.execute(sql`
        WITH freed AS (
          UPDATE ${occupancy} o SET active = false
          FROM (
            SELECT o2.id FROM ${occupancy} o2
            JOIN reservation r ON r.id = o2.reservation_id
            WHERE o2.accommodation_id = ${input.accommodationId} AND o2.active
              AND o2.source_type = 'RESERVATION'
              AND r.status = 'PENDING' AND r.hold_expires_at < now()
              AND o2.during && daterange(${input.startDate}::date, ${input.endDate}::date, '[)')
          ) exp
          WHERE o.id = exp.id
          RETURNING o.reservation_id AS rid
        )
        UPDATE reservation SET status = 'EXPIRED', updated_at = now()
        WHERE id IN (SELECT rid FROM freed) AND status = 'PENDING'`);

      const [row] = await tx
        .insert(block)
        .values({
          accommodationId: input.accommodationId,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason ?? null,
          createdByAdminId: input.adminId ?? null,
        })
        .returning();

      await tx.insert(occupancy).values({
        accommodationId: input.accommodationId,
        checkIn: input.startDate,
        checkOut: input.endDate,
        sourceType: "BLOCK",
        blockId: row.id,
        active: true,
      });

      await tx.insert(auditLog).values({
        actorType: "USER",
        actorId: input.adminId ?? null,
        action: "block.create",
        entityType: "block",
        entityId: row.id,
        metadata: { start: input.startDate, end: input.endDate },
      });

      return row;
    });
  } catch (error) {
    if (pgError(error).code === "23P01") {
      throw new BlockConflictError(
        "OVERLAP",
        "O período conflita com uma reserva ou bloqueio existente.",
      );
    }
    throw error;
  }
}

/** Remove um bloqueio (a occupancy é removida em cascata pela FK). */
export async function deleteBlock(
  id: string,
  adminId?: string | null,
): Promise<boolean> {
  const [row] = await db
    .delete(block)
    .where(eq(block.id, id))
    .returning({ id: block.id });
  if (row) {
    await db.insert(auditLog).values({
      actorType: "USER",
      actorId: adminId ?? null,
      action: "block.delete",
      entityType: "block",
      entityId: id,
    });
  }
  return Boolean(row);
}

export type BlockListItem = Block & { accommodationName: string };

export async function listBlocks(): Promise<BlockListItem[]> {
  const rows = await db
    .select({
      id: block.id,
      accommodationId: block.accommodationId,
      startDate: block.startDate,
      endDate: block.endDate,
      reason: block.reason,
      createdByAdminId: block.createdByAdminId,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
      accommodationName: accommodation.name,
    })
    .from(block)
    .innerJoin(accommodation, eq(accommodation.id, block.accommodationId))
    .orderBy(asc(block.startDate))
    .limit(200);
  return rows;
}

export type CalendarEntry = {
  checkIn: string;
  checkOut: string;
  type: "RESERVATION" | "BLOCK";
  status: string | null;
  publicCode: string | null;
  label: string | null;
};

/** Ocupações ativas e válidas (ignora holds vencidos) que tocam a janela `[from, to)`. */
export async function listOccupancyForCalendar(
  accommodationId: string,
  from: string,
  to: string,
): Promise<CalendarEntry[]> {
  const rows = await db.execute<{
    check_in: string;
    check_out: string;
    source_type: "RESERVATION" | "BLOCK";
    status: string | null;
    public_code: string | null;
    reason: string | null;
  }>(sql`
    SELECT o.check_in, o.check_out, o.source_type, r.status, r.public_code, b.reason
    FROM ${occupancy} o
    LEFT JOIN reservation r ON r.id = o.reservation_id
    LEFT JOIN ${block} b ON b.id = o.block_id
    WHERE o.accommodation_id = ${accommodationId} AND o.active
      AND o.during && daterange(${from}::date, ${to}::date, '[)')
      AND NOT (o.source_type = 'RESERVATION' AND r.status = 'PENDING' AND r.hold_expires_at < now())
    ORDER BY o.check_in`);
  return rows.map((row) => ({
    checkIn: row.check_in,
    checkOut: row.check_out,
    type: row.source_type,
    status: row.status,
    publicCode: row.public_code,
    label: row.reason,
  }));
}
