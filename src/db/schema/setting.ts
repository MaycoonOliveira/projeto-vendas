import { jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/**
 * `setting` — configurações operacionais da pousada (chave/valor tipado em jsonb). Ex.: texto da
 * política de cancelamento, horários de check-in/out, contatos. Leitura/escrita só no painel.
 */
export const setting = pgTable(
  "setting",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    value: jsonb("value"),
    updatedByAdminId: text("updated_by_admin_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("setting_key_unique").on(t.key)],
);
