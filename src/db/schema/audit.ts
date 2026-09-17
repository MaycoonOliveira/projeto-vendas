import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * `audit_log` — auditoria de ações sensíveis (append-only por convenção; sem UPDATE/DELETE pela
 * app). `actor_id` referencia `user.id` (text) quando `actor_type='USER'` — sem FK de propósito,
 * para o log sobreviver à remoção de um usuário. Nunca gravar PII sensível em `metadata`.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_created_idx").on(t.createdAt),
    check(
      "audit_log_actor_type",
      sql`${t.actorType} in ('USER','SYSTEM','GUEST')`,
    ),
  ],
);
