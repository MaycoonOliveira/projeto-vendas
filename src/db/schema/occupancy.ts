import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { accommodation } from "./accommodation";
import { block } from "./block";
import { reservation } from "./reservation";

/**
 * `occupancy` — ledger de ocupação (Fase 4). É a **garantia anti-overbooking** do sistema:
 * cada reserva ativa e cada bloqueio geram UMA linha; a EXCLUDE constraint GiST rejeita
 * atomicamente qualquer sobreposição de datas na mesma acomodação.
 *
 * Modelagem: guardamos `check_in`/`check_out` (datas puras) e uma coluna GERADA
 * `during daterange(check_in, check_out, '[)')` (semiaberto — o dia de check-out fica livre).
 * A EXCLUDE é **parcial** (`WHERE active`): ocupações inativas (canceladas/expiradas) não
 * bloqueiam. Coluna gerada + EXCLUDE parcial não são modeladas pelo Drizzle → adicionadas via
 * SQL na migration (ver drizzle/0003_*.sql). Requer `btree_gist` (migration 0000).
 *
 * `reservation_id`/`block_id`: as tabelas `reservation` (Fase 5) e `block` (Fase 6) ainda não
 * existem — as colunas ficam aqui e ganham FK nas migrations dessas fases.
 */
export const occupancy = pgTable(
  "occupancy",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accommodationId: uuid("accommodation_id")
      .notNull()
      .references(() => accommodation.id, { onDelete: "restrict" }),
    checkIn: date("check_in", { mode: "string" }).notNull(),
    checkOut: date("check_out", { mode: "string" }).notNull(),
    sourceType: text("source_type").notNull(),
    reservationId: uuid("reservation_id").references(() => reservation.id, {
      onDelete: "cascade",
    }),
    blockId: uuid("block_id").references(() => block.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("occupancy_acc_active_idx").on(t.accommodationId, t.active),
    check("occupancy_dates_order", sql`${t.checkOut} > ${t.checkIn}`),
    check(
      "occupancy_source_type",
      sql`${t.sourceType} in ('RESERVATION','BLOCK')`,
    ),
    // Exatamente uma origem preenchida, coerente com source_type.
    check(
      "occupancy_source_consistent",
      sql`(${t.sourceType} = 'RESERVATION' AND ${t.reservationId} IS NOT NULL AND ${t.blockId} IS NULL)
        OR (${t.sourceType} = 'BLOCK' AND ${t.blockId} IS NOT NULL AND ${t.reservationId} IS NULL)`,
    ),
  ],
);
