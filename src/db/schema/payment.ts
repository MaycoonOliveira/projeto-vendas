import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { reservation } from "./reservation";
import { user } from "./auth";

/** Métodos de pagamento registrados manualmente (V1 — sem gateway; gateway é V2). */
export const PAYMENT_METHODS = ["PIX", "CASH", "CARD", "TRANSFER", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * `payment` — registro **manual** de pagamento de uma reserva (Fase 8.3).
 *
 * V1 não tem gateway: o admin registra o que recebeu (valor, data, método). Isto habilita o
 * financeiro real (Fase 10) sem depender de integração. Valores sempre em centavos (inteiro).
 * Não guarda dados de cartão (o gateway do V2 fará isso).
 */
export const payment = pgTable(
  "payment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservation.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    paidOn: date("paid_on", { mode: "string" }).notNull(),
    method: text("method").notNull(),
    note: text("note"),
    recordedByAdminId: text("recorded_by_admin_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("payment_reservation_idx").on(t.reservationId),
    index("payment_paid_on_idx").on(t.paidOn),
    check("payment_amount_positive", sql`${t.amountCents} > 0`),
    check(
      "payment_method_valid",
      sql`${t.method} in ('PIX','CASH','CARD','TRANSFER','OTHER')`,
    ),
  ],
);
