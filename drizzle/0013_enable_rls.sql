-- Segurança (correção do alerta "Security Advisor" do Supabase) — RLS + revogação de acesso da API.
--
-- CONTEXTO: usamos o Supabase APENAS como Postgres (auth/authz na aplicação via Better Auth + DAL;
-- ver AGENTS.md/plano). Porém o Supabase, por padrão, EXPÕE o schema `public` pela API REST
-- (PostgREST) usando as roles `anon`/`authenticated`, e concede privilégios a elas em toda tabela
-- nova. Como nunca ativamos RLS nem revogamos esses grants, as tabelas ficaram acessíveis pela API
-- (com a chave anon, pública) — incluindo `user`/`account` (hash de senha), `session` (tokens) e
-- `guest` (PII). Este é exatamente o achado do advisor ("RLS desativado" + "colunas sensíveis").
--
-- CORREÇÃO (defesa em profundidade, sem mudar a arquitetura):
--   1) ENABLE ROW LEVEL SECURITY em todas as tabelas do `public`, SEM policies → a API (anon/
--      authenticated) passa a receber ZERO linhas e ter escrita negada. A APLICAÇÃO NÃO É AFETADA:
--      conecta como `postgres` (rolbypassrls = true), que ignora RLS.
--   2) REVOKE de todos os privilégios de `anon`/`authenticated` nas tabelas/sequências do `public`.
--   3) ALTER DEFAULT PRIVILEGES para que tabelas/sequências FUTURAS (criadas por `postgres` via
--      migrations) não voltem a ser concedidas a `anon`/`authenticated`.
--
-- NOTA: tabelas novas ainda precisam de `ENABLE ROW LEVEL SECURITY` (o passo 3 corta o grant, mas
-- não liga RLS). Reaplicar o bloco abaixo após criar novas tabelas mantém o alerta zerado.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.relname);
  END LOOP;
END $$;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
