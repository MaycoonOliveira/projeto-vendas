import { and, desc, eq, gt, gte, ilike, lte, or, sql } from "drizzle-orm";

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
import { listPayments, totalPaidCents } from "@/lib/services/payment";
import { createNotification } from "@/lib/services/notification";

/**
 * Operações administrativas de reserva (Fase 6): máquina de estados, edição transacional com
 * optimistic locking e consultas para o painel. Autorização é feita na borda (Server Actions/DAL).
 */

/**
 * Transições permitidas (todas as demais são proibidas). Terminais não têm saída.
 * Fase 8 (ADR-0001): CONFIRMED→CHECKED_IN→CHECKED_OUT. `COMPLETED` mantido como terminal legado.
 */
const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "EXPIRED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "COMPLETED", "NO_SHOW"],
  CHECKED_IN: ["CHECKED_OUT"],
  CHECKED_OUT: [],
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
  const updated = await db.transaction(async (tx) => {
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

  // Notifica a equipe sobre cancelamento (best-effort, fora da transação).
  if (to === "CANCELLED") {
    await createNotification({
      type: "RESERVATION_CANCELLED",
      title: "Reserva cancelada",
      body: `A reserva ${updated.publicCode} foi cancelada${opts.reason ? ` — ${opts.reason}` : ""}.`,
      entityType: "reservation",
      entityId: id,
      link: `/admin/reservas/${id}`,
    });
  }

  return updated;
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
export const checkInReservation = (id: string, adminId?: string | null) =>
  transitionReservation(id, "CHECKED_IN", { adminId });
export const checkOutReservation = (id: string, adminId?: string | null) =>
  transitionReservation(id, "CHECKED_OUT", { adminId });

/** Atualiza a nota interna (admin) — distinta da observação do hóspede. Fase 8.2. */
export async function setInternalNote(
  id: string,
  note: string | null,
  adminId?: string | null,
): Promise<void> {
  const [row] = await db
    .update(reservation)
    .set({ internalNote: note, updatedAt: new Date() })
    .where(eq(reservation.id, id))
    .returning({ id: reservation.id });
  if (!row) throw new ReservationConflictError("NOT_FOUND", "Reserva não encontrada.");
  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: adminId ?? null,
    action: "reservation.internal_note",
    entityType: "reservation",
    entityId: id,
  });
}

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

export type ReservationListResult = {
  items: ReservationListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listReservations(filters?: {
  status?: ReservationStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<ReservationListResult> {
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filters?.pageSize ?? 25));

  const conds = [];
  if (filters?.status) conds.push(eq(reservation.status, filters.status));
  const q = filters?.q?.trim();
  if (q) {
    conds.push(
      or(
        ilike(guest.fullName, `%${q}%`),
        ilike(reservation.publicCode, `%${q}%`),
      ),
    );
  }
  const where = conds.length ? and(...conds) : undefined;

  const [items, countRows] = await Promise.all([
    db
      .select(reservationListSelect())
      .from(reservation)
      .innerJoin(guest, eq(guest.id, reservation.guestId))
      .innerJoin(accommodation, eq(accommodation.id, reservation.accommodationId))
      .where(where)
      .orderBy(desc(reservation.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reservation)
      .innerJoin(guest, eq(guest.id, reservation.guestId))
      .where(where),
  ]);

  return { items, total: countRows[0]?.n ?? 0, page, pageSize };
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
  const [payments, paidCents] = await Promise.all([
    listPayments(id),
    totalPaidCents(id),
  ]);
  return { reservation: r, guest: g, accommodation: acc, history, payments, paidCents };
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

function reservationListSelect() {
  return {
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
  };
}

export type OperationalSnapshot = {
  today: string;
  arrivalsToday: ReservationListItem[];
  departuresToday: ReservationListItem[];
  inHouse: ReservationListItem[];
  occupiedToday: number;
  activeAccommodations: number;
  pendingCount: number;
  expiringHolds: ReservationListItem[];
};

/** Retrato operacional do dia para o dashboard (uma leitura consolidada). */
export async function operationalSnapshot(): Promise<OperationalSnapshot> {
  const today = todayInSaoPaulo();
  const STAYING = ["CONFIRMED", "CHECKED_IN"] as const;

  const baseQuery = () =>
    db
      .select(reservationListSelect())
      .from(reservation)
      .innerJoin(guest, eq(guest.id, reservation.guestId))
      .innerJoin(accommodation, eq(accommodation.id, reservation.accommodationId));

  const [arrivalsToday, departuresToday, inHouse, counts] = await Promise.all([
    baseQuery()
      .where(and(inArrayStatus(STAYING), eq(reservation.checkIn, today)))
      .orderBy(reservation.checkIn)
      .limit(50),
    baseQuery()
      .where(and(inArrayStatus(STAYING), eq(reservation.checkOut, today)))
      .orderBy(reservation.checkOut)
      .limit(50),
    baseQuery()
      .where(
        and(
          inArrayStatus(STAYING),
          lte(reservation.checkIn, today),
          gt(reservation.checkOut, today),
        ),
      )
      .orderBy(reservation.checkIn)
      .limit(50),
    db.execute<{
      occupied: number;
      active_acc: number;
      pending: number;
    }>(sql`
      SELECT
        (SELECT count(DISTINCT o.accommodation_id)::int FROM occupancy o
           LEFT JOIN reservation r ON r.id = o.reservation_id
          WHERE o.active AND o.during @> ${today}::date
            AND NOT (o.source_type='RESERVATION' AND r.status='PENDING' AND r.hold_expires_at < now())
        ) AS occupied,
        (SELECT count(*)::int FROM accommodation WHERE is_active AND deleted_at IS NULL) AS active_acc,
        (SELECT count(*)::int FROM reservation
          WHERE status='PENDING' AND (hold_expires_at IS NULL OR hold_expires_at >= now())
        ) AS pending`),
  ]);

  const expiringHolds = await baseQuery()
    .where(
      and(
        eq(reservation.status, "PENDING"),
        gt(reservation.holdExpiresAt, sql`now()`),
        lte(reservation.holdExpiresAt, sql`now() + interval '12 hours'`),
      ),
    )
    .orderBy(reservation.holdExpiresAt)
    .limit(20);

  const c = counts[0] ?? { occupied: 0, active_acc: 0, pending: 0 };
  return {
    today,
    arrivalsToday,
    departuresToday,
    inHouse,
    occupiedToday: c.occupied,
    activeAccommodations: c.active_acc,
    pendingCount: c.pending,
    expiringHolds,
  };
}

/** Helper: filtro por lista de status (evita `inArray` importado só p/ isto). */
function inArrayStatus(statuses: readonly string[]) {
  return sql`${reservation.status} IN (${sql.join(
    statuses.map((s) => sql`${s}`),
    sql`, `,
  )})`;
}

