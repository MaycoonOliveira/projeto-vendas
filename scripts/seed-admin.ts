import "./load-env";

import { eq } from "drizzle-orm";

import { auth } from "../src/lib/auth";
import { db, getSql } from "../src/db";
import { user } from "../src/db/schema";

/**
 * Cria o usuário administrador (login é desabilitado no cadastro público).
 *
 * Uso:
 *   npm run db:seed:admin -- --email=voce@dominio.com --password=<min 12 chars> [--name="Seu Nome"]
 *   (ou defina SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME)
 *
 * Idempotente-guardado: se o e-mail já existir, não altera nada.
 */
function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const email = arg("email") ?? process.env.SEED_ADMIN_EMAIL;
  const password = arg("password") ?? process.env.SEED_ADMIN_PASSWORD;
  const name = arg("name") ?? process.env.SEED_ADMIN_NAME ?? "Administrador";

  if (!email || !password) {
    console.error(
      "Uso: npm run db:seed:admin -- --email=<email> --password=<senha> [--name=<nome>]",
    );
    process.exitCode = 1;
    return;
  }
  if (password.length < 12) {
    console.error("A senha deve ter no mínimo 12 caracteres.");
    process.exitCode = 1;
    return;
  }

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  if (existing.length > 0) {
    console.error(`Já existe um usuário com e-mail ${email}. Nada foi alterado.`);
    process.exitCode = 1;
    return;
  }

  const ctx = await auth.$context;

  // Os tipos gerados marcam esses métodos internos com aridade estrita; em runtime 1 arg basta
  // (comprovado por smoke test). Cast tipado para uma assinatura mínima e segura.
  const ia = ctx.internalAdapter as unknown as {
    createUser: (data: Record<string, unknown>) => Promise<{ id: string }>;
    createAccount: (data: Record<string, unknown>) => Promise<unknown>;
  };
  const password_ = ctx as unknown as {
    password: { hash: (p: string) => Promise<string> };
  };

  const hashed = await password_.password.hash(password);

  const created = await ia.createUser({
    email,
    name,
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

  console.log(`Admin criado com sucesso: ${email} (id ${created.id}).`);
}

main()
  .catch((error) => {
    console.error("Erro no seed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getSql()
      .end()
      .catch(() => {});
    process.exit(process.exitCode ?? 0);
  });
