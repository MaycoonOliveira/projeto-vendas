import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * `notification` — avisos administrativos (Fase 9). Modelo **global à equipe** (poucos admins de
 * mesmo nível): sem destinatário por usuário no V1. `read_at` marca como lida.
 *
 * - Eventos (nova reserva, cancelamento, check-in/out, pagamento) são inseridos no ato.
 * - Avisos derivados do tempo (hold expirando, chegadas/saídas de hoje) são gerados sob demanda
 *   ao abrir o centro de notificações (sem cron), com `dedupe_key` único para não duplicar.
 */
export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    /** Link relativo do recurso (ex.: `/admin/reservas/{id}`). */
    link: text("link"),
    /** Chave de deduplicação para avisos derivados (NULL = evento único, sempre inserido). */
    dedupeKey: text("dedupe_key"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("notification_dedupe_key_unique").on(t.dedupeKey),
    index("notification_read_idx").on(t.readAt),
    index("notification_created_idx").on(t.createdAt),
  ],
);
