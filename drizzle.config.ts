import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

/**
 * Configuração do Drizzle Kit (migrations = fonte de verdade do schema).
 *
 * `loadEnvConfig` carrega `.env.local`/`.env` exatamente como o Next faz — necessário porque o
 * Drizzle Kit roda FORA do runtime do Next (ver docs do Next 16: "Loading Environment Variables
 * with @next/env").
 *
 * Migrations usam a conexão DIRETA / session mode (`DIRECT_URL`), pois o pooler de transação do
 * Supabase (Supavisor) não suporta prepared statements. Runtime da app usa `DATABASE_URL`.
 */
loadEnvConfig(process.cwd());

// Não lançamos aqui para permitir `drizzle-kit generate` offline (não conecta ao banco).
// Comandos que conectam (`migrate`/`push`/`studio`) falham de forma clara com este placeholder.
const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  "postgres://REQUIRES_DATABASE_URL@localhost:5432/casa_carram";

if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
  console.warn(
    "[drizzle.config] DATABASE_URL/DIRECT_URL ausentes — 'generate' funciona offline, " +
      "mas 'migrate'/'push'/'studio' exigem uma conexão válida (defina em .env.local).",
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: connectionString },
  strict: true,
  verbose: true,
});
