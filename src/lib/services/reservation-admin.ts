import { and, desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  accommodation,
  auditLog,
  guest,
  occupancy,
  rateOverride,
  reservation,
  reservationStatusHistory,
} from "@/db/schema";
import { todayInSaoPaulo } from "@/lib/dates";
import { calculatePrice } from "@/lib/pricing";
import type { ReservationStatus } from "@/db/schema";
import {
  pgError,
  ReservationConflictError,
  type Reservation,
} from "@/lib/services/reservation";

/**
 * Operações administrativas de reserva (Fase 6): máquina de estados, edição transacional com
 * optimistic locking e consultas para o painel. Autorização é feita na borda (Server Actions/DAL).
 */

/** Transições permitidas (todas as demais são proibidas). Terminais não têm saída. */
const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["CANCELLED", "COMPLETED", "NO_SHOW"],
  CANCELLED: [],
  EXPIRED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

/** Estados que liberam o inventário ao serem atingidos (occupancy.active = false). */
const FREEING = new Set<ReservationStatus>(["CANCELLED", "EXPIRED"]);

export function canTransition(
  from: ReservationStatus,
  to: ReservationStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Muda o status de uma reserva respeitando a máquina de estados (transacional).
 * Libera o inventário quando vai para CANCELLED/EXPIRED. Registra histórico + auditoria.
 */
export async function transitionReservation(
  id: string,
  to: ReservationStatus,
  opts: { adminId?: string | null; reason?: string | null } = {},
): Promise<Reservation> {
  return db.transaction(async (tx) => {
    const rows = await tx.execute<{ status: ReservationStatus }>(
      sql`SELECT status FROM ${reservation} WHERE id = ${id} FOR UPDATE`,
    );
    const current = rows[0];
    if (!current) {
      throw new ReservationConflictError("NOT_FOUND", "Reserva não encontrada.");
    }
    const from = current.status;
    if (!canTransition(from, to)) {
      throw new ReservationConflictError(
        "INVALID_TRANSITION",
        `Transição inválida: ${from} → ${to}.`,
      );
    }

    const [updated] = await tx
      .update(reservation)
      .set({
        status: to,
        version: sql`${reservation.version} + 1`,
        updatedAt: new Date(),
        ...(to === "CANCELLED" ? { cancelledReason: opts.reason ?? null } : {}),
      })
      .where(eq(reservation.id, id))
      .returning();

    if (FREEING.has(to)) {
      await tx
        .update(occupancy)
        .set({ active: false })
        .where(
          and(eq(occupancy.reservationId, id), eq(occupancy.active, true)),
        );
    }

    await tx.insert(reservationStatusHistory).values({
      reservationId: id,
      fromStatus: from,
      toStatus: to,
      changedByAdminId: opts.adminId ?? null,
      reason: opts.reason ?? null,
    });
    await tx.insert(auditLog).values({
      actorType: "USER",
      actorId: opts.adminId ?? null,
      action: `reservation.${to.toLowerCase()}`,
      entityType: "reservation",
      entityId: id,
      metadata: { from, to },
    });

    return updated;
  });
}

export const confirmReservation = (id: string, adminId?: string | null) =>
  transitionReservation(id, "CONFIRMED", { adminId });
export const cancelReservation = (
  id: string,
  adminId?: string | null,
  reason?: string | null,
) => transitionReservation(id, "CANCELLED", { adminId, reason });
export const completeReservation = (id: string, adminId?: string | null) =>
  transitionReservation(id, "COMPLETED", { adminId });
export const noShowReservation = (id: string, adminId?: string | null) =>
  transitionReservation(id, "NO_SHOW", { adminId });

export type EditReservationPatch = {
  checkIn?: string;
  checkOut?: string;
  guestsCount?: number;
  accommodationId?: string;
};

/**
 * Edita datas/hóspedes/acomodação de uma reserva PENDING/CONFIRMED (transacional):
 * optimistic locking (`version`) contra edição concorrente + revalidação da EXCLUDE constraint
 * (conflito de calendário → UNAVAILABLE) + recálculo de preço no servidor.
 */
export async function editReservation(
  id: string,
  patch: EditReservationPatch,
  expectedVersion: number,
  adminId?: string | null,
): Promise<Reservation> {
  try {
    return await db.transaction(async (tx) => {
      const rows = await tx.execute<{
        status: ReservationStatus;
        version: number;
        check_in: string;
        check_out: string;
        guests_count: number;
        accommodation_id: string;
      }>(sql`
        SELECT status, version, check_in, check_out, guests_count, accommodation_id
        FROM ${reservation} WHERE id = ${id} FOR UPDATE`);
      const cur = rows[0];
      if (!cur) throw new ReservationConflictError("NOT_FOUND", "Reserva não encontrada.");
      if (cur.status !== "PENDING" && cur.status !== "CONFIRMED") {
        throw new ReservationConflictError(
          "INVALID_TRANSITION",
          "Só é possível editar reservas pendentes ou confirmadas.",
        );
      }
      if (cur.version !== expectedVersion) {
        throw new ReservationConflictError(
          "VERSION",
          "A reserva foi alterada por outra pessoa. Recarregue e tente de novo.",
        );
      }

      const accId = patch.accommodationId ?? cur.accommodation_id;
      const checkIn = patch.checkIn ?? cur.check_in;
      const checkOut = patch.checkOut ?? cur.check_out;
      const guestsCount = patch.guestsCount ?? cur.guests_count;

      // Lock da acomodação alvo + validações.
      const accRows = await tx.execute<{
        capacity: number;
        min_nights: number;
        base_price_cents: number;
        is_active: boolean;
      }>(sql`
        SELECT capacity, min_nights, base_price_cents, is_active
        FROM ${accommodation} WHERE id = ${accId} AND deleted_at IS NULL FOR UPDATE`);
      const acc = accRows[0];
      if (!acc || !acc.is_active) {
        throw new ReservationConflictError("NOT_FOUND", "Acomodação indisponível.");
      }
      if (guestsCount > acc.capacity) {
        throw new ReservationConflictError("CAPACITY", "Hóspedes acima da capacidade.");
      }
      const nights = Math.round(
        (Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000,
      );
      if (nights < 1) {
        throw new ReservationConflictError("UNAVAILABLE", "Período inválido.");
      }
      if (nights < acc.min_nights) {
        throw new ReservationConflictError(
          "MIN_NIGHTS",
          `Estadia mínima de ${acc.min_nights} noite(s).`,
        );
      }

      // expire-on-write no alvo (libera holds vencidos que colidem).
      await tx.execute(sql`
        WITH freed AS (
          UPDATE ${occupancy} o SET active = false
          FROM ${reservation} r
          WHERE o.reservation_id = r.id AND o.accommodation_id = ${accId}
            AND o.active AND o.source_type = 'RESERVATION'
            AND r.id <> ${id}
            AND r.status = 'PENDING' AND r.hold_expires_at < now()
            AND o.during && daterange(${checkIn}::date, ${checkOut}::date, '[)')
          RETURNING o.reservation_id AS rid
        )
        UPDATE ${reservation} SET status = 'EXPIRED', updated_at = now()
        WHERE id IN (SELECT rid FROM freed) AND status = 'PENDING'`);

      const overrides = await tx
        .select()
        .from(rateOverride)
        .where(eq(rateOverride.accommodationId, accId));
      const price = calculatePrice({
        checkIn,
        checkOut,
        basePriceCents: acc.base_price_cents,
        overrides: overrides.map((o) => ({
          startDate: o.startDate,
          endDate: o.endDate,
          priceCents: o.priceCents,
        })),
      });

      // Move/atualiza a ocupação ativa — a EXCLUDE valida o novo período.
      await tx
        .update(occupancy)
        .set({ accommodationId: accId, checkIn, checkOut })
        .where(
          and(eq(occupancy.reservationId, id), eq(occupancy.active, true)),
        );

      const [updated] = await tx
        .update(reservation)
        .set({
          accommodationId: accId,
          checkIn,
          checkOut,
          guestsCount,
          nights: price.nights,
          totalPriceCents: price.totalCents,
          priceBreakdown: price.breakdown,
          version: sql`${reservation.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(reservation.id, id))
        .returning();

      await tx.insert(auditLog).values({
        actorType: "USER",
        actorId: adminId ?? null,
        action: "reservation.edit",
        entityType: "reservation",
        entityId: id,
        metadata: { checkIn, checkOut, guestsCount, accommodationId: accId },
      });

      return updated;
    });
  } catch (error) {
    if (pgError(error).code === "23P01") {
      throw new ReservationConflictError(
        "UNAVAILABLE",
        "As novas datas conflitam com outra reserva/bloqueio.",
      );
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Consultas para o painel
// ---------------------------------------------------------------------------

export type ReservationListItem = {
  id: string;
  publicCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  totalPriceCents: number;
  source: string;
  holdExpiresAt: Date | null;
  guestName: string;
  accommodationName: string;
};

export async function listReservations(filters?: {
  status?: ReservationStatus;
}): Promise<ReservationListItem[]> {
  const where = filters?.status
    ? eq(reservation.status, filters.status)
    : undefined;
  const rows = await db
    .select({
      id: reservation.id,
      publicCode: reservation.publicCode,
      status: reservation.status,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      nights: reservation.nights,
      guestsCount: reservation.guestsCount,
      totalPriceCents: reservation.totalPriceCents,
      source: reservation.source,
      holdExpiresAt: reservation.holdExpiresAt,
      guestName: guest.fullName,
      accommodationName: accommodation.name,
    })
    .from(reservation)
    .innerJoin(guest, eq(guest.id, reservation.guestId))
    .innerJoin(accommodation, eq(accommodation.id, reservation.accommodationId))
    .where(where)
    .orderBy(desc(reservation.createdAt))
    .limit(200);
  return rows;
}

export async function getReservationAdmin(id: string) {
  const [r] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, id))
    .limit(1);
  if (!r) return null;
  const [g] = await db.select().from(guest).where(eq(guest.id, r.guestId)).limit(1);
  const [acc] = await db
    .select({ id: accommodation.id, name: accommodation.name })
    .from(accommodation)
    .where(eq(accommodation.id, r.accommodationId))
    .limit(1);
  const history = await db
    .select()
    .from(reservationStatusHistory)
    .where(eq(reservationStatusHistory.reservationId, id))
    .orderBy(desc(reservationStatusHistory.createdAt));
  return { reservation: r, guest: g, accommodation: acc, history };
}

/** Contagem de reservas por status (para o dashboard). */
export async function reservationStatsByStatus(): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: reservation.status, count: sql<number>`count(*)::int` })
    .from(reservation)
    .groupBy(reservation.status);
  const out: Record<string, number> = {};
  for (const row of rows) out[row.status] = row.count;
  return out;
}

/** Próximas chegadas confirmadas (check-in a partir de hoje). */
export async function upcomingArrivals(limitN = 8): Promise<ReservationListItem[]> {
  const today = todayInSaoPaulo();
  const rows = await db
    .select({
      id: reservation.id,
      publicCode: reservation.publicCode,
      status: reservation.status,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      nights: reservation.nights,
      guestsCount: reservation.guestsCount,
      totalPriceCents: reservation.totalPriceCents,
      source: reservation.source,
      holdExpiresAt: reservation.holdExpiresAt,
      guestName: guest.fullName,
      accommodationName: accommodation.name,
    })
    .from(reservation)
    .innerJoin(guest, eq(guest.id, reservation.guestId))
    .innerJoin(accommodation, eq(accommodation.id, reservation.accommodationId))
    .where(and(eq(reservation.status, "CONFIRMED"), gte(reservation.checkIn, today)))
    .orderBy(reservation.checkIn)
    .limit(limitN);
  return rows;
}

export type GuestListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  reservations: number;
};

export async function listGuests(): Promise<GuestListItem[]> {
  const rows = await db
    .select({
      id: guest.id,
      fullName: guest.fullName,
      email: guest.email,
      phone: guest.phone,
      reservations: sql<number>`count(${reservation.id})::int`,
    })
    .from(guest)
    .leftJoin(reservation, eq(reservation.guestId, guest.id))
    .groupBy(guest.id)
    .orderBy(desc(guest.createdAt))
    .limit(200);
  return rows;
}
