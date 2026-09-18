import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { accommodation } from "./accommodation";
import { guest } from "./guest";
import { user } from "./auth";

/**
 * Estados possíveis da reserva (máquina de estados no serviço).
 * `CHECKED_IN`/`CHECKED_OUT` adicionados na Fase 8 (ADR-0001). `COMPLETED` mantido como
 * terminal legado (retrocompatível); novos check-outs usam `CHECKED_OUT`.
 */
export const RESERVATION_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
  "NO_SHOW",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/**
 * `reservation` — a reserva (Fase 5).
 *
 * - `public_code`: capability aleatória de alta entropia (~128 bits) — nunca id sequencial
 *   (anti-IDOR/enumeração). É o que o hóspede usa para consultar a própria reserva.
 * - `total_price_cents` + `price_breakdown`: preço **congelado** no ato (calculado no servidor).
 * - `hold_expires_at`: só para PENDING de origem WEBSITE (janela de 24h). Correção via
 *   expire-on-write/read (ver ReservationService/AvailabilityService).
 * - `version`: optimistic locking para edição concorrente (admin, Fase 6).
 * - `idempotency_key`: dedupe de POST /api/reservas (duplo clique/retry) → retorna a mesma reserva.
 */
export const reservation = pgTable(
  "reservation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicCode: text("public_code").notNull(),
    accommodationId: uuid("accommodation_id")
      .notNull()
      .references(() => accommodation.id, { onDelete: "restrict" }),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guest.id, { onDelete: "restrict" }),
    checkIn: date("check_in", { mode: "string" }).notNull(),
    checkOut: date("check_out", { mode: "string" }).notNull(),
    guestsCount: integer("guests_count").notNull(),
    nights: integer("nights").notNull(),
    totalPriceCents: integer("total_price_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    priceBreakdown: jsonb("price_breakdown"),
    status: text("status").notNull().default("PENDING"),
    source: text("source").notNull().default("WEBSITE"),
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    notes: text("notes"),
    /** Nota interna do admin (distinta de `notes`, que é a observação do hóspede). Fase 8.2. */
    internalNote: text("internal_note"),
    createdByAdminId: text("created_by_admin_id").references(() => user.id, {
      onDelete: "set null",
    }),
    cancelledReason: text("cancelled_reason"),
    idempotencyKey: text("idempotency_key"),
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("reservation_public_code_unique").on(t.publicCode),
    unique("reservation_idempotency_key_unique").on(t.idempotencyKey),
    index("reservation_acc_dates_idx").on(
      t.accommodationId,
      t.checkIn,
      t.checkOut,
    ),
    index("reservation_status_idx").on(t.status),
    index("reservation_guest_idx").on(t.guestId),
    check("reservation_dates_order", sql`${t.checkOut} > ${t.checkIn}`),
    check("reservation_guests_positive", sql`${t.guestsCount} > 0`),
    check("reservation_total_nonneg", sql`${t.totalPriceCents} >= 0`),
    check(
      "reservation_status_valid",
      sql`${t.status} in ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED','EXPIRED','COMPLETED','NO_SHOW')`,
    ),
    check("reservation_source_valid", sql`${t.source} in ('WEBSITE','MANUAL')`),
  ],
);

/** `reservation_status_history` — trilha append-only de mudanças de estado. */
export const reservationStatusHistory = pgTable(
  "reservation_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservation.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    changedByAdminId: text("changed_by_admin_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reservation_history_res_idx").on(t.reservationId)],
);
