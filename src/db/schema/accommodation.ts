import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * `accommodation` — o que se vende (Fase 3). Fotos/comodidades seguem estáticas no V1.
 * Soft delete (`deleted_at`): não apagar acomodações com histórico de reservas.
 */
export const accommodation = pgTable(
  "accommodation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    capacity: integer("capacity").notNull(),
    basePriceCents: integer("base_price_cents").notNull(),
    minNights: integer("min_nights").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("accommodation_slug_unique").on(t.slug),
    index("accommodation_is_active_idx").on(t.isActive),
    check("accommodation_capacity_positive", sql`${t.capacity} > 0`),
    check("accommodation_base_price_nonneg", sql`${t.basePriceCents} >= 0`),
    check("accommodation_min_nights_min", sql`${t.minNights} >= 1`),
  ],
);

/**
 * `rate_override` — tarifas por período (sazonalidade). A garantia de **não-sobreposição** por
 * acomodação (≤ 1 override por noite ⇒ preço determinístico) é uma EXCLUDE constraint GiST sobre
 * uma coluna gerada `during daterange(start,end,'[]')`, adicionada via SQL na migration (Drizzle
 * não modela EXCLUDE/coluna gerada de daterange). Ver drizzle/0002_*.sql.
 */
export const rateOverride = pgTable(
  "rate_override",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accommodationId: uuid("accommodation_id")
      .notNull()
      .references(() => accommodation.id, { onDelete: "cascade" }),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    priceCents: integer("price_cents").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("rate_override_acc_dates_idx").on(
      t.accommodationId,
      t.startDate,
      t.endDate,
    ),
    check("rate_override_dates_order", sql`${t.startDate} <= ${t.endDate}`),
    check("rate_override_price_nonneg", sql`${t.priceCents} >= 0`),
  ],
);
