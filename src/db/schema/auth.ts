import {
  bigint,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Schema das tabelas do Better Auth (Fase 2) — fonte única de auth, versionada no Drizzle.
 *
 * IMPORTANTE: as CHAVES das propriedades (camelCase: `emailVerified`, `userId`, `expiresAt`…)
 * são os NOMES DE CAMPO que o Better Auth espera — o `drizzleAdapter` mapeia por elas. As
 * colunas no banco usam snake_case (nossa convenção). Não renomear as chaves.
 *
 * `role`/`isActive` são additionalFields (config em `src/lib/auth.ts`): `role` base p/ RBAC no V2;
 * `isActive` para desativar admins sem apagar. `audit_log.actor_id` referenciará `user.id`.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  // additionalFields
  role: text("role").default("ADMIN").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$defaultFn(
    () => new Date(),
  ),
});

/**
 * `rate_limit` (Fase 14) — store PERSISTENTE do rate limit do Better Auth.
 *
 * O rate limit nativo é em memória por instância; em serverless (Vercel) cada lambda tem a sua,
 * tornando o limite ineficaz. Com `rateLimit.storage: "database"` (em `src/lib/auth.ts`), o
 * Better Auth passa a contar aqui — compartilhado entre todas as instâncias.
 *
 * Campos exigidos pelo Better Auth (mapeados por chave camelCase): `key`, `count`, `lastRequest`
 * (epoch em ms). `key` é único: o algoritmo cria a linha e, em corrida, relê a existente —
 * garantindo UMA contagem por (IP + rota). `id` é gerado pelo Better Auth.
 */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").unique(),
  count: integer("count"),
  lastRequest: bigint("last_request", { mode: "number" }),
});
