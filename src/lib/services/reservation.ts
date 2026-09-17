import { eq, sql, type InferSelectModel } from "drizzle-orm";

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
import { calculatePrice } from "@/lib/pricing";
import { generatePublicCode } from "@/lib/reservation-code";

export type Reservation = InferSelectModel<typeof reservation>;
export type Guest = InferSelectModel<typeof guest>;

/** Janela do hold de reserva pública (24h) — decisão travada no plano. */
export const HOLD_WINDOW_HOURS = 24;

export type ReservationConflictReason =
  | "UNAVAILABLE" // datas ficaram indisponíveis (exclusion constraint / revalidação)
  | "CAPACITY" // hóspedes acima da capacidade
  | "MIN_NIGHTS" // abaixo da estadia mínima
  | "NOT_FOUND"; // acomodação inexistente/inativa

export class ReservationConflictError extends Error {
  constructor(
    public readonly reason: ReservationConflictReason,
    message?: string,
  ) {
    super(message ?? reason);
    this.name = "ReservationConflictError";
  }
}

/** Percorre a cadeia `.cause` (o Drizzle envolve o erro do driver) até achar o SQLSTATE. */
function pgError(error: unknown): { code?: string; constraint?: string } {
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current != null; depth += 1) {
    if (typeof current === "object" && current !== null && "code" in current) {
      const e = current as { code?: unknown; constraint_name?: unknown };
      if (typeof e.code === "string" && e.code) {
        return {
          code: e.code,
          constraint:
            typeof e.constraint_name === "string" ? e.constraint_name : undefined,
        };
      }
    }
    current = (current as { cause?: unknown }).cause;
  }
  return {};
}

export type CreateReservationInput = {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  guest: { fullName: string; email: string; phone: string; notes?: string | null };
  source?: "WEBSITE" | "MANUAL";
  /** Reserva manual do admin nasce CONFIRMED (sem hold). */
  createdByAdminId?: string | null;
  idempotencyKey?: string | null;
  ip?: string | null;
};

export type CreateReservationResult = {
  reservation: Reservation;
  guest: Guest;
  /** `true` se a mesma Idempotency-Key já havia criado esta reserva (retorno idempotente). */
  replay: boolean;
};

async function findByIdempotencyKey(
  key: string,
): Promise<CreateReservationResult | null> {
  const [row] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.idempotencyKey, key))
    .limit(1);
  if (!row) return null;
  const [g] = await db.select().from(guest).where(eq(guest.id, row.guestId)).limit(1);
  return { reservation: row, guest: g, replay: true };
}

/**
 * Cria uma reserva de forma **transacional e livre de corrida** (núcleo anti-overbooking):
 *   1. `SELECT … FOR UPDATE` na acomodação → serializa criadores concorrentes.
 *   2. valida capacidade / estadia mínima.
 *   3. **expire-on-write**: desativa ocupações de holds PENDING vencidos que colidem (marca EXPIRED).
 *   4. recalcula o preço no servidor (ignora qualquer valor do cliente).
 *   5. reusa/insere `guest` (por e-mail) + insere `reservation` + insere `occupancy`.
 *      A **EXCLUDE constraint** de `occupancy` é a barreira final: overlap ativo → 23P01 → 409.
 *   6. registra histórico de status + auditoria (tudo na mesma transação).
 * READ COMMITTED basta (o lock ordena as etapas 2–5).
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const source = input.source ?? "WEBSITE";
  const isManual = source === "MANUAL";
  const initialStatus = isManual ? "CONFIRMED" : "PENDING";
  const holdExpiresAt = isManual
    ? null
    : new Date(Date.now() + HOLD_WINDOW_HOURS * 3600_000);

  // Idempotência (retorno rápido antes de abrir transação).
  if (input.idempotencyKey) {
    const existing = await findByIdempotencyKey(input.idempotencyKey);
    if (existing) return existing;
  }

  const publicCode = generatePublicCode();

  try {
    return await db.transaction(async (tx) => {
      // 1. Lock da acomodação (serializa etapas 2–5 por acomodação).
      const accRows = await tx.execute<{
        id: string;
        capacity: number;
        min_nights: number;
        base_price_cents: number;
        is_active: boolean;
      }>(sql`
        SELECT id, capacity, min_nights, base_price_cents, is_active
        FROM ${accommodation}
        WHERE id = ${input.accommodationId} AND deleted_at IS NULL
        FOR UPDATE`);
      const acc = accRows[0];
      if (!acc || !acc.is_active) {
        throw new ReservationConflictError("NOT_FOUND", "Acomodação indisponível.");
      }

      // 2. Regras de negócio.
      if (input.guestsCount > acc.capacity) {
        throw new ReservationConflictError(
          "CAPACITY",
          "Número de hóspedes acima da capacidade.",
        );
      }
      const nights = Math.round(
        (Date.parse(input.checkOut) - Date.parse(input.checkIn)) / 86_400_000,
      );
      if (nights < acc.min_nights) {
        throw new ReservationConflictError(
          "MIN_NIGHTS",
          `Estadia mínima de ${acc.min_nights} noite(s).`,
        );
      }

      // 3. expire-on-write: libera holds vencidos que colidem e marca-os EXPIRED.
      const expired = await tx.execute<{ id: string }>(sql`
        WITH freed AS (
          UPDATE ${occupancy} o SET active = false
          FROM ${reservation} r
          WHERE o.reservation_id = r.id AND o.accommodation_id = ${input.accommodationId}
            AND o.active AND o.source_type = 'RESERVATION'
            AND r.status = 'PENDING' AND r.hold_expires_at < now()
            AND o.during && daterange(${input.checkIn}::date, ${input.checkOut}::date, '[)')
          RETURNING o.reservation_id AS rid
        ),
        exp AS (
          UPDATE ${reservation} SET status = 'EXPIRED', updated_at = now()
          WHERE id IN (SELECT rid FROM freed) AND status = 'PENDING'
          RETURNING id
        )
        SELECT id FROM exp`);
      for (const row of expired) {
        await tx.insert(reservationStatusHistory).values({
          reservationId: row.id,
          fromStatus: "PENDING",
          toStatus: "EXPIRED",
          reason: "hold_expired",
        });
      }

      // 4. Preço recalculado no servidor (congela total + breakdown).
      const overrides = await tx
        .select()
        .from(rateOverride)
        .where(eq(rateOverride.accommodationId, input.accommodationId));
      const price = calculatePrice({
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        basePriceCents: acc.base_price_cents,
        overrides: overrides.map((o) => ({
          startDate: o.startDate,
          endDate: o.endDate,
          priceCents: o.priceCents,
        })),
      });

      // 5a. Reusa hóspede por e-mail (case-insensitive) ou cria.
      const email = input.guest.email.trim().toLowerCase();
      const existingGuest = await tx
        .select()
        .from(guest)
        .where(sql`lower(${guest.email}) = ${email}`)
        .limit(1);
      let guestRow = existingGuest[0];
      if (!guestRow) {
        const inserted = await tx
          .insert(guest)
          .values({
            fullName: input.guest.fullName,
            email,
            phone: input.guest.phone,
            notes: input.guest.notes ?? null,
          })
          .returning();
        guestRow = inserted[0];
      }

      // 5b. Insere a reserva (preço congelado).
      const [resRow] = await tx
        .insert(reservation)
        .values({
          publicCode,
          accommodationId: input.accommodationId,
          guestId: guestRow.id,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guestsCount: input.guestsCount,
          nights: price.nights,
          totalPriceCents: price.totalCents,
          currency: price.currency,
          priceBreakdown: price.breakdown,
          status: initialStatus,
          source,
          holdExpiresAt,
          createdByAdminId: input.createdByAdminId ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
        })
        .returning();

      // 5c. Ocupa o inventário — a EXCLUDE constraint valida a sobreposição (barreira final).
      await tx.insert(occupancy).values({
        accommodationId: input.accommodationId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        sourceType: "RESERVATION",
        reservationId: resRow.id,
        active: true,
      });

      // 6. Histórico + auditoria (mesma transação).
      await tx.insert(reservationStatusHistory).values({
        reservationId: resRow.id,
        fromStatus: null,
        toStatus: initialStatus,
        changedByAdminId: input.createdByAdminId ?? null,
        reason: isManual ? "manual_create" : "website_request",
      });
      await tx.insert(auditLog).values({
        actorType: isManual ? "USER" : "GUEST",
        actorId: input.createdByAdminId ?? null,
        action: "reservation.create",
        entityType: "reservation",
        entityId: resRow.id,
        metadata: {
          publicCode: resRow.publicCode,
          status: initialStatus,
          nights: price.nights,
          totalCents: price.totalCents,
        },
        ip: input.ip ?? null,
      });

      return { reservation: resRow, guest: guestRow, replay: false };
    });
  } catch (error) {
    const { code, constraint } = pgError(error);
    // Sobreposição na occupancy (barreira final).
    if (code === "23P01") {
      throw new ReservationConflictError(
        "UNAVAILABLE",
        "As datas acabaram de ficar indisponíveis.",
      );
    }
    // Corrida de Idempotency-Key: a outra requisição criou primeiro → devolve a existente.
    if (code === "23505" && constraint === "reservation_idempotency_key_unique") {
      if (input.idempotencyKey) {
        const existing = await findByIdempotencyKey(input.idempotencyKey);
        if (existing) return existing;
      }
    }
    throw error;
  }
}

/** Busca a reserva pelo `public_code` (consulta pública). `null` se não existir. */
export async function getReservationByPublicCode(
  publicCode: string,
): Promise<{ reservation: Reservation; guest: Guest; accommodationName: string } | null> {
  const [row] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.publicCode, publicCode))
    .limit(1);
  if (!row) return null;

  const [g] = await db.select().from(guest).where(eq(guest.id, row.guestId)).limit(1);
  const [acc] = await db
    .select({ name: accommodation.name })
    .from(accommodation)
    .where(eq(accommodation.id, row.accommodationId))
    .limit(1);

  return { reservation: row, guest: g, accommodationName: acc?.name ?? "Acomodação" };
}

/** `true` se a reserva é um hold PENDING vencido (para exibição/expire-on-read na consulta). */
export function isExpiredHold(r: Pick<Reservation, "status" | "holdExpiresAt">): boolean {
  return (
    r.status === "PENDING" &&
    r.holdExpiresAt != null &&
    r.holdExpiresAt.getTime() < Date.now()
  );
}
