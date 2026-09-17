import { and, asc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { accommodation, occupancy, rateOverride, reservation } from "@/db/schema";
import { eachNight, nightsBetween } from "@/lib/dates";
import { calculatePrice, type PriceResult } from "@/lib/pricing";
import type { Accommodation } from "@/lib/services/accommodation";

/**
 * AvailabilityService (Fase 4) — leitura de disponibilidade sobre o ledger `occupancy`.
 *
 * Regra formal: uma acomodação está disponível para `[checkIn, checkOut)` sse NÃO existir
 * `occupancy` ativa dela cujo `during` sobreponha (`&&`) o período. Intervalo semiaberto:
 * datas adjacentes (`[10,12)` + `[12,14)`) não conflitam.
 *
 * **expire-on-read**: uma ocupação de hold PENDING **vencido** (`hold_expires_at < now()`) é
 * ignorada — coincide com o que o expire-on-write liberaria na escrita. Blocos e reservas
 * CONFIRMED continuam bloqueando.
 */

/**
 * Fragmento SQL: existe ocupação ATIVA e VÁLIDA da acomodação sobrepondo `[checkIn, checkOut)`?
 * `accId` pode ser um valor (string → parâmetro) ou uma coluna Drizzle (identificador),
 * ambos aceitos pelo template `sql`.
 */
function overlapsExisting(accId: unknown, checkIn: string, checkOut: string) {
  // `during` é uma coluna GERADA existente só na migration (Drizzle não a modela) → raw.
  return sql`EXISTS (
    SELECT 1 FROM ${occupancy}
    LEFT JOIN ${reservation} ON ${reservation.id} = ${occupancy.reservationId}
    WHERE ${occupancy.accommodationId} = ${accId}
      AND ${occupancy.active}
      AND ${sql.raw('"occupancy"."during"')} && daterange(${checkIn}::date, ${checkOut}::date, '[)')
      AND NOT (
        ${occupancy.sourceType} = 'RESERVATION'
        AND ${reservation.status} = 'PENDING'
        AND ${reservation.holdExpiresAt} < now()
      )
  )`;
}

/** `true` se o período está livre na acomodação (usado depois pelo ReservationService). */
export async function isRangeAvailable(
  accommodationId: string,
  checkIn: string,
  checkOut: string,
): Promise<boolean> {
  const rows = await db.execute<{ occupied: boolean }>(
    sql`SELECT ${overlapsExisting(accommodationId, checkIn, checkOut)} AS occupied`,
  );
  return !rows[0]?.occupied;
}

export type AvailabilityResult = {
  accommodation: Accommodation;
  price: PriceResult;
};

/**
 * Lista acomodações **disponíveis** para o período/hóspedes, com o total calculado no servidor.
 * Filtros: ativa, não-deletada, `capacity >= guests`, `min_nights <= noites` e sem sobreposição.
 */
export async function findAvailableAccommodations(input: {
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<AvailabilityResult[]> {
  const { checkIn, checkOut, guests } = input;
  const nights = nightsBetween(checkIn, checkOut);

  const available = await db
    .select()
    .from(accommodation)
    .where(
      and(
        eq(accommodation.isActive, true),
        isNull(accommodation.deletedAt),
        gte(accommodation.capacity, guests),
        lte(accommodation.minNights, nights),
        sql`NOT ${overlapsExisting(accommodation.id, checkIn, checkOut)}`,
      ),
    )
    .orderBy(asc(accommodation.sortOrder), asc(accommodation.name));

  if (available.length === 0) return [];

  // Busca todos os overrides das acomodações disponíveis de uma vez (evita N+1).
  const ids = available.map((a) => a.id);
  const overrides = await db
    .select()
    .from(rateOverride)
    .where(inArray(rateOverride.accommodationId, ids));

  const overridesByAcc = new Map<string, typeof overrides>();
  for (const o of overrides) {
    const list = overridesByAcc.get(o.accommodationId) ?? [];
    list.push(o);
    overridesByAcc.set(o.accommodationId, list);
  }

  return available.map((acc) => ({
    accommodation: acc,
    price: calculatePrice({
      checkIn,
      checkOut,
      basePriceCents: acc.basePriceCents,
      overrides: (overridesByAcc.get(acc.id) ?? []).map((o) => ({
        startDate: o.startDate,
        endDate: o.endDate,
        priceCents: o.priceCents,
      })),
    }),
  }));
}

/**
 * Disponibilidade agregada da propriedade por noite, para o **calendário público**.
 * Uma noite é `occupied` quando **todas** as acomodações ativas estão ocupadas nela
 * (reserva ativa/hold válido ou bloqueio) — ou seja, não há nada livre para ofertar.
 *
 * Não expõe NENHUM dado identificável (código de reserva, hóspede, motivo de bloqueio):
 * devolve apenas `{ date, occupied }`. Respeita expire-on-read (ignora holds vencidos).
 */
export type DayAvailability = { date: string; occupied: boolean };

export async function getPropertyAvailability(
  from: string,
  to: string,
): Promise<DayAvailability[]> {
  const totalRows = await db.execute<{ total: number }>(sql`
    SELECT count(*)::int AS total FROM ${accommodation}
    WHERE ${accommodation.isActive} = true AND ${accommodation.deletedAt} IS NULL`);
  const totalActive = Number(totalRows[0]?.total ?? 0);

  const days = eachNight(from, to);
  if (totalActive === 0) return days.map((date) => ({ date, occupied: false }));

  const rows = await db.execute<{
    accommodation_id: string;
    check_in: string;
    check_out: string;
  }>(sql`
    SELECT o.accommodation_id, o.check_in, o.check_out
    FROM ${occupancy} o
    LEFT JOIN ${reservation} r ON r.id = o.reservation_id
    WHERE o.active
      AND o.during && daterange(${from}::date, ${to}::date, '[)')
      AND NOT (o.source_type = 'RESERVATION' AND r.status = 'PENDING' AND r.hold_expires_at < now())`);

  // Para cada noite, conjunto de acomodações ocupadas. occupied = todas ocupadas.
  const occupiedByDay = new Map<string, Set<string>>();
  for (const row of rows) {
    for (const night of eachNight(row.check_in, row.check_out)) {
      if (night < from || night >= to) continue;
      const set = occupiedByDay.get(night) ?? new Set<string>();
      set.add(row.accommodation_id);
      occupiedByDay.set(night, set);
    }
  }

  return days.map((date) => ({
    date,
    occupied: (occupiedByDay.get(date)?.size ?? 0) >= totalActive,
  }));
}
