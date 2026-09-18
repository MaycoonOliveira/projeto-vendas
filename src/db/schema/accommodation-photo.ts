import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { accommodation } from "./accommodation";

/**
 * `accommodation_photo` — fotos de uma acomodação (Fase: PMS). V1 armazena **URLs** de imagens
 * (o admin registra o endereço da foto); upload binário para object storage (Supabase Storage)
 * é um fast-follow que apenas troca a origem da `url`. Exibidas no site público.
 */
export const accommodationPhoto = pgTable(
  "accommodation_photo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accommodationId: uuid("accommodation_id")
      .notNull()
      .references(() => accommodation.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("accommodation_photo_acc_idx").on(t.accommodationId, t.sortOrder)],
);
