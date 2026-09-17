import "./load-env";

import { eq } from "drizzle-orm";

import { auth } from "../src/lib/auth";
import { db, getSql } from "../src/db";
import { user } from "../src/db/schema";

/**
 * Cria um usuário admin **dedicado a E2E** (Playwright), isolado do admin real. Credenciais vêm de
 * `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` (em `.env.local`, gitignored). Idempotente: se já existir,
 * não altera. A senha nunca é impressa.
 */
async function main() {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD em .env.local.");
    process.exitCode = 1;
    return;
  }

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing.length > 0) {
    console.log(`Admin E2E já existe: ${email}. Nada alterado.`);
    return;
  }

  const ctx = await auth.$context;
  const ia = ctx.internalAdapter as unknown as {
    createUser: (data: Record<string, unknown>) => Promise<{ id: string }>;
    createAccount: (data: Record<string, unknown>) => Promise<unknown>;
  };
  const hasher = ctx as unknown as {
    password: { hash: (p: string) => Promise<string> };
  };

  const hashed = await hasher.password.hash(password);
  const created = await ia.createUser({
    email,
    name: "Admin E2E",
    emailVerified: true,
    role: "ADMIN",
    isActive: true,
  });
  await ia.createAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: hashed,
  });

  console.log(`Admin E2E criado: ${email} (id ${created.id}).`);
}

main()
  .catch((error) => {
    console.error("Erro no seed E2E:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getSql().end().catch(() => {});
    process.exit(process.exitCode ?? 0);
  });
