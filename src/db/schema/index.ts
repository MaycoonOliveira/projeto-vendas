/**
 * Schema Drizzle — fonte de verdade do banco.
 *
 * As migrations são geradas a partir daqui (`drizzle-kit generate`) e são a fonte de verdade
 * do schema no Postgres (Supabase). Ver `docs/database/DATABASE-DESIGN.md`.
 *
 * Fase 1 (Fundação): ainda NÃO há tabelas — apenas a migration de extensões
 * (`pgcrypto`, `btree_gist`). As tabelas entram nas próximas fases:
 *   - Fase 2: Better Auth (`user`, `session`, `account`, `verification`) via schema gerado.
 *   - Fase 3+: domínio (`accommodation`, `rate_override`, `guest`, `reservation`, `occupancy`, ...).
 */
export {};
