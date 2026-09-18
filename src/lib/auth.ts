import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "../db";
import * as schema from "../db/schema";
import { sendEmail } from "./email";

/**
 * Instância do Better Auth (Fase 2) — autenticação administrativa.
 *
 * Decisões (ver docs/security/SECURITY-ARCHITECTURE.md e QUINTA ETAPA do plano):
 * - E-mail/senha COM `disableSignUp` (hóspedes não logam; admins criados via seed — `scripts/`).
 * - Sessões persistidas em DB (revogáveis) via `drizzleAdapter`; expiração absoluta + renovação.
 * - `role`/`isActive` como additionalFields no `user` (RBAC no V2), `input: false` (anti-escalonamento).
 * - Senha: mínimo 12 caracteres.
 * - Rate limit nativo (memória por instância no V1; store persistente = follow-up não bloqueante).
 *
 * Secret: lido de `BETTER_AUTH_SECRET`. O placeholder existe SÓ para o `next build` (CI) não
 * quebrar na análise estática — nenhuma auth roda em build. Em runtime o secret real é exigido
 * (Vercel env / `.env.local`); o route handler valida (`assertAuthConfigured`).
 */
const BUILD_ONLY_SECRET =
  "BUILD_ONLY_PLACEHOLDER_SECRET_DO_NOT_USE_AT_RUNTIME_0000000000";

export function assertAuthConfigured() {
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET ausente em runtime — configure a variável de ambiente.",
    );
  }
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? BUILD_ONLY_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
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
    resetPasswordTokenExpiresIn: 60 * 30, // 30 min (token de uso único)
    revokeSessionsOnPasswordReset: true, // invalida todas as sessões ao trocar a senha
    sendResetPassword: async ({ user, token }) => {
      // O link precisa apontar para a NOSSA página de redefinição (`/admin/redefinir-senha`),
      // que lê `?token=` — não para o path padrão do Better Auth (`/reset-password/{token}`),
      // que não existe no app (dava 404). Base = BETTER_AUTH_URL (a URL pública do ambiente).
      const base = (process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
        .trim()
        .replace(/\/+$/, "");
      const resetUrl = `${base}/admin/redefinir-senha?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: user.email,
        subject: "Redefinição de senha — Casa Carram",
        text: `Recebemos um pedido para redefinir a senha do painel da Casa Carram.

Abra o link abaixo (expira em 30 minutos):
${resetUrl}

Se você não solicitou, ignore este e-mail — sua senha permanece a mesma.`,
        html: `<p>Recebemos um pedido para redefinir a senha do painel da Casa Carram.</p>
<p><a href="${resetUrl}">Redefinir minha senha</a> (o link expira em 30 minutos).</p>
<p>Se você não solicitou, ignore este e-mail — sua senha permanece a mesma.</p>`,
      });
    },
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
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 900, max: 10 }, // ~10 tentativas / 15 min
      "/forget-password": { window: 900, max: 5 },
      "/reset-password": { window: 900, max: 10 },
    },
  },
  plugins: [nextCookies()],
});
