import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getEnv } from "../lib/env";
import * as schema from "./schema";

/**
 * Cliente do banco (Postgres/Supabase via Drizzle) — inicialização PREGUIÇOSA.
 *
 * - `prepare: false`: obrigatório com o pooler de TRANSAÇÃO do Supabase (Supavisor).
 * - Lazy (via Proxy): a conexão só é criada na PRIMEIRA query. Isso permite que `next build`
 *   (que importa módulos sem executá-los) rode SEM `DATABASE_URL` — essencial no CI.
 * - Singleton em `globalThis`: evita esgotar o pool em serverless / hot-reload.
 *
 * `server-only` NÃO fica aqui: o módulo é carregado por ferramentas fora do Next (Drizzle Kit,
 * seeds, jiti). O guard vive na DAL/auth (que o browser nunca importa). Imports relativos por
 * compatibilidade com esses loaders.
 */
type Db = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __casaCarramSql?: ReturnType<typeof postgres>;
  __casaCarramDb?: Db;
};

function getSqlClient() {
  if (!globalForDb.__casaCarramSql) {
    const { DATABASE_URL } = getEnv();
    globalForDb.__casaCarramSql = postgres(DATABASE_URL, {
      prepare: false, // obrigatório com o pooler de transação (Supavisor).
      // `max > 1` evita head-of-line blocking: enquanto uma conexão "acorda" o compute do
      // Supabase (free tier hiberna), as outras seguem servindo. Seguro no pooler de transação
      // (feito para muitas conexões curtas). Baixo tráfego de uma pousada não esgota o pool.
      //
      // ATENÇÃO: quando o nº de queries SIMULTÂNEAS ultrapassa `max`, o pool trava (as
      // excedentes ficam na fila e o Postgres acaba cancelando com 57014) — a tela fica
      // presa no skeleton. Mantemos folga aqui e evitamos rajadas grandes por request
      // (ex.: a página /admin/financeiro roda as queries em série).
      max: 10,
      idle_timeout: 120, // mantém a conexão quente durante o uso; recicla só após 2min ociosa.
      connect_timeout: 30, // tolera o cold-start do compute do Supabase ao (re)conectar.
    });
  }
  return globalForDb.__casaCarramSql;
}

function getDb(): Db {
  if (!globalForDb.__casaCarramDb) {
    globalForDb.__casaCarramDb = drizzle(getSqlClient(), { schema });
  }
  return globalForDb.__casaCarramDb;
}

/** Instância Drizzle. As propriedades são resolvidas na 1ª utilização (lazy). */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

/** Cliente `postgres` bruto (para scripts/seeds que precisam encerrar a conexão). */
export function getSql() {
  return getSqlClient();
}

export { schema };
