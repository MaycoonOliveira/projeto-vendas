import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { accommodation } from "./accommodation";
import { user } from "./auth";

/**
 * `block` — bloqueio manual de datas (Fase 6): manutenção, uso do dono, etc. Ocupa o mesmo ledger
 * `occupancy` (source_type='BLOCK') e passa pela mesma EXCLUDE constraint anti-sobreposição.
 * Intervalo semiaberto `[start_date, end_date)` (coerente com reservas e o `during` do occupancy).
 */
export const block = pgTable(
  "block",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accommodationId: uuid("accommodation_id")
      .notNull()
      .references(() => accommodation.id, { onDelete: "restrict" }),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    reason: text("reason"),
    createdByAdminId: text("created_by_admin_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("block_acc_dates_idx").on(t.accommodationId, t.startDate, t.endDate),
    check("block_dates_order", sql`${t.endDate} > ${t.startDate}`),
  ],
);
