import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "@/lib/env";
import * as schema from "@/db/schema";

/**
 * Cliente do banco (Postgres/Supabase via Drizzle).
 *
 * - `prepare: false`: obrigatório com o pooler de TRANSAÇÃO do Supabase (Supavisor), que não
 *   suporta prepared statements entre requisições.
 * - Singleton em `globalThis` no desenvolvimento: evita abrir novas conexões a cada
 *   hot-reload e esgotar o pool no ambiente serverless.
 *
 * Este módulo é `server-only`: nunca deve ser importado por um Client Component.
 */
const globalForDb = globalThis as unknown as {
  __casaCarramSql?: ReturnType<typeof postgres>;
};

function createSqlClient() {
  const { DATABASE_URL } = getEnv();
  return postgres(DATABASE_URL, {
    prepare: false,
    max: 1,
  });
}

const sql = globalForDb.__casaCarramSql ?? createSqlClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__casaCarramSql = sql;
}

export const db = drizzle(sql, { schema });
export { schema, sql };
