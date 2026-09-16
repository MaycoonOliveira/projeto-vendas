import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";
import * as schema from "../db/schema";
import { getAuthEnv } from "./env";

const { secret, baseURL } = getAuthEnv();

/**
 * Instância do Better Auth (Fase 2) — autenticação administrativa.
 *
 * Decisões (ver docs/security/SECURITY-ARCHITECTURE.md e QUINTA ETAPA do plano):
 * - E-mail/senha COM `disableSignUp` (hóspedes não logam; admins criados via seed/servidor).
 * - Sessões persistidas em DB (revogáveis) via `drizzleAdapter`.
 * - `role`/`isActive` como additionalFields no `user` (base p/ RBAC no V2), `input: false`
 *   para impedir escalonamento de privilégio pela API pública.
 * - Política de senha: mínimo 12 caracteres.
 *
 * O schema destas tabelas (`user`/`session`/`account`/`verification`) é gerado pela CLI do
 * Better Auth e versionado no Drizzle (migrations = fonte de verdade). Após gerar, o schema é
 * ligado ao adapter via `{ schema }`.
 */
export const auth = betterAuth({
  secret,
  baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "ADMIN", input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias (absoluta)
    updateAge: 60 * 60 * 24, // renova a cada 1 dia
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [nextCookies()],
});
