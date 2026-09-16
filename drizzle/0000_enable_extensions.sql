-- Fase 1 (Fundação) — extensões do PostgreSQL.
-- Sem tabelas: apenas a base exigida pelo modelo de dados (ver docs/database/DATABASE-DESIGN.md).

-- gen_random_uuid() para PKs uuid nas tabelas de domínio (Fase 3+).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Exclusion constraints com (accommodation_id WITH =, during WITH &&):
-- núcleo anti-overbooking em `occupancy` e não-sobreposição em `rate_override`.
CREATE EXTENSION IF NOT EXISTS btree_gist;
