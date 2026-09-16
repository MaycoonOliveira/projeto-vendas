import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "../lib/env";
import * as schema from "./schema";

/**
 * Cliente do banco (Postgres/Supabase via Drizzle).
 *
 * - `prepare: false`: obrigatório com o pooler de TRANSAÇÃO do Supabase (Supavisor), que não
 *   suporta prepared statements entre requisições.
 * - Singleton em `globalThis` fora de produção: evita abrir novas conexões a cada hot-reload
 *   e esgotar o pool no ambiente serverless.
 *
 * Observação: o guard `server-only` NÃO fica aqui de propósito — este módulo também é carregado
 * por ferramentas fora do runtime do Next (Drizzle Kit, seeds, CLI do Better Auth). O guard
 * `server-only` vive nas camadas sensíveis (DAL/auth), que o cliente do browser nunca importa.
 * Imports relativos (não `@/`) mantêm compatibilidade com o loader (jiti) dessas ferramentas.
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
