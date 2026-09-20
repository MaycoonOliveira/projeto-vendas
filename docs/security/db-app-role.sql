-- ============================================================================
-- Role de aplicação com MENOR PRIVILÉGIO — Casa Carram (Fase 14, hardening)
-- ============================================================================
-- Objetivo: o RUNTIME da app (DATABASE_URL) conecta com uma role que só faz
-- SELECT/INSERT/UPDATE/DELETE — SEM poder criar/alterar/derrubar tabelas (DDL),
-- e SEM poder adulterar o log de auditoria. As MIGRATIONS continuam usando a role
-- privilegiada (`postgres`, via DIRECT_URL), que é a dona do schema.
--
-- Por que: se a credencial de runtime vazar, o dano fica contido — nada de DROP TABLE,
-- nada de apagar auditoria, nada de alterar o schema. É a recomendação da §5 do plano
-- (least-privilege DB) e da Fase 14.
--
-- COMO RODAR (uma vez, por ambiente — DEV e PROD são bancos separados):
--   1. Supabase → SQL Editor (você está conectado como `postgres`, o dono).
--   2. Troque o placeholder <SENHA_FORTE> por um segredo forte (ex.: `openssl rand -base64 24`).
--   3. Rode este arquivo inteiro.
--   4. Monte a nova connection string do RUNTIME trocando usuário/senha pela role `casa_app`,
--      MANTENDO o host do POOLER de transação (porta 6543):
--        postgresql://casa_app:<SENHA_FORTE>@aws-<region>.pooler.supabase.com:6543/postgres
--      Coloque essa string em DATABASE_URL (.env.local + Vercel). O DIRECT_URL (migrations)
--      continua como `postgres` (5432).
--
-- Reversível: para remover, `DROP OWNED BY casa_app; DROP ROLE casa_app;`
-- ============================================================================

-- 1) A role da aplicação: pode logar, NÃO herda superpoderes, NÃO cria DB/role.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'casa_app') THEN
    CREATE ROLE casa_app LOGIN PASSWORD '<SENHA_FORTE>'
      NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

-- Garante que a senha esteja atualizada mesmo se a role já existir (idempotente).
ALTER ROLE casa_app WITH PASSWORD '<SENHA_FORTE>' NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- 2) Conectar ao banco e enxergar o schema public (mas NÃO criar objetos nele).
GRANT CONNECT ON DATABASE postgres TO casa_app;
GRANT USAGE ON SCHEMA public TO casa_app;   -- USAGE = ver/usar; sem CREATE (bloqueia DDL no schema)
REVOKE CREATE ON SCHEMA public FROM casa_app;

-- 3) CRUD nas tabelas que JÁ existem + uso de sequences (ids/serials).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO casa_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO casa_app;

-- 4) Mesmas permissões para tabelas/sequences FUTURAS (criadas pelas próximas migrations).
--    `FOR ROLE postgres` porque é o `postgres` (dono) que cria os objetos nas migrations.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO casa_app;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO casa_app;

-- 5) Auditoria à prova de adulteração: a role da app só pode INSERIR e LER `audit_log`.
--    (O trigger em drizzle/0012 já bloqueia UPDATE/DELETE; aqui reforçamos por privilégio —
--    defesa em profundidade. Assim nem uma tentativa chega ao trigger.)
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE audit_log FROM casa_app;

-- 6) (Opcional, recomendado) Nunca conceder à app o poder de desativar triggers/constraints:
--    isso já é barrado por não ser dona das tabelas + NOSUPERUSER. Nada a fazer.

-- ----------------------------------------------------------------------------
-- Verificação rápida (rode depois; deve listar apenas privilégios de dados):
--   SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE grantee = 'casa_app' ORDER BY table_name, privilege_type;
-- Esperado: SELECT/INSERT/UPDATE/DELETE nas tabelas; em `audit_log`, só SELECT/INSERT.
-- ----------------------------------------------------------------------------
