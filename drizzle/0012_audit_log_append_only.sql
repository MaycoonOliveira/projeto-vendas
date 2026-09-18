-- Fase 14 (Hardening) — `audit_log` append-only NO NÍVEL DO BANCO.
-- O código já só faz INSERT, mas isso era só convenção. Aqui bloqueamos UPDATE/DELETE via trigger:
-- o log de auditoria vira à prova de adulteração (ver docs/security/THREAT-MODEL.md §5). Inserção
-- e leitura seguem normais; truncate/DDL não são cobertos por trigger de linha (exigem privilégio
-- de owner, fora da role da app).

CREATE OR REPLACE FUNCTION audit_log_block_mutation()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log é append-only: % não permitido', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_log_no_update ON "audit_log";
--> statement-breakpoint
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
--> statement-breakpoint
DROP TRIGGER IF EXISTS audit_log_no_delete ON "audit_log";
--> statement-breakpoint
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
