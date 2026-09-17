/**
 * Schema Drizzle — fonte de verdade do banco.
 *
 * As migrations são geradas a partir daqui (`drizzle-kit generate`) e são a fonte de verdade
 * do schema no Postgres (Supabase). Ver `docs/database/DATABASE-DESIGN.md`.
 *
 * Fase 2: tabelas do Better Auth (`user`, `session`, `account`, `verification`).
 * Fase 3: domínio (`accommodation`, `rate_override`, `audit_log`).
 * Fase 4: `occupancy` (ledger anti-overbooking).
 * Fase 5+: `guest`, `reservation`, `block`, ...
 */
export * from "./auth";
export * from "./accommodation";
export * from "./audit";
export * from "./occupancy";
