# Status do Projeto — Casa Carram

> Atualizado após a auditoria de produto (Set/2026). Fonte de verdade do "onde estamos".

## Onde estamos
- **Concluído:** Fases 0–6 (fundação, auth, acomodações/preços, disponibilidade, reservas
  anti-overbooking, painel operacional). Branch de trabalho: `develop`.
- **Em andamento:** **Fase 7 — Operação diária & UX crítica** (ver `roadmap.md`).
- **Referências de produto:** `product-gap-analysis.md` (matriz de gaps), `roadmap.md` (fases),
  ADRs em `docs/adr/`.

## Stack (verificada)
Next.js 16 (App Router, proxy.ts) · React 19 · TS strict · Tailwind v4 · Supabase Postgres (só banco;
pooler Supavisor, `max:5`) · Drizzle (migrations = fonte de verdade; 0000–0005 aplicadas) · Better
Auth (admin) · Zod · Resend · Vitest (43 testes) + Playwright (configurado, sem specs).

## Entidades do banco (migrations 0000–0005)
`user/session/account/verification` (Better Auth) · `accommodation` · `rate_override` · `audit_log` ·
`occupancy` (EXCLUDE anti-overbooking) · `guest` · `reservation` (+ `reservation_status_history`) ·
`block` · `setting`. **Novas previstas:** `payment` (Fase 8.3), `notification` (Fase 9), estrutura de
fidelidade (Fase 13), auth do hóspede (Fase 11).

## Decisões travadas relevantes
- V1 **sem pagamento online** (hold + cobrança externa); financeiro V1 = derivado de reservas +
  pagamento **manual**. Pagamento online = V2.
- Anti-overbooking garantido no banco (EXCLUDE gist + transação); **não** regredir.
- CTAs "Reservar" apontam para `/reservar` (Airbnb comentado, reversível).
- Cold-start do Supabase free é característica de ambiente (pool `max:5` + timeout no cliente
  mitigam); some em plano pago/produção com tráfego.

## Riscos/pendências abertas
- E2E ainda não escritos (Fase 7/8/14). Retenção LGPD a definir antes do PROD. Portal do cliente
  reabre a decisão "hóspede sem login" (ADR-0002).
