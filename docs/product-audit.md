# Product Audit — Casa Carram PMS

> Auditoria de 2026-09-18. Transição de "MVP administrativo" para **PMS completo** (pousada única,
> Petrópolis/RJ). Estado factual do sistema tem precedência sobre docs antigos quando divergirem.
> Fonte de verdade do schema: migrations Drizzle (`drizzle/`). Ver também [roadmap.md](roadmap.md).

## 1. Estado atual (o que existe e funciona)

| Área | Estado | Evidência |
|---|---|---|
| **Reservas anti-overbooking** | ✅ Sólido | `occupancy` + EXCLUDE GiST; provado sob concorrência real (1×201 + 1×409) |
| **Ciclo de reserva** | ✅ PENDING→CONFIRMED→CHECKED_IN→CHECKED_OUT (+CANCELLED/EXPIRED/NO_SHOW/COMPLETED) | máquina de estados testada (unit + DB) |
| **Disponibilidade pública** | ✅ `/api/disponibilidade` + calendário visual em `/reservar` | expire-on-read/write |
| **Fotos de acomodação** | ✅ (V1 por URL) | `accommodation_photo`; exibidas no site |
| **Pagamento manual** | ✅ `payment` (valor/data/método) + saldo por reserva | sem gateway (V2) |
| **Notificações admin** | ✅ sino + eventos + avisos de tempo (sem cron) | `notification` |
| **Financeiro** | ✅ KPIs + faturamento/mês + status + métodos | `/admin/financeiro` |
| **Painel operacional** | ✅ dashboard (chegadas/saídas/ocupação/atenção), calendário mensal embutido | reservas confirmadas destacadas |
| **Auth admin** | ✅ Better Auth (sessões em DB, reset via Resend) | `proxy.ts` + DAL |
| **Mobile** | ✅ drawer via portal (bug do backdrop-filter corrigido) | público + admin |

### Schema atual (tabelas)
`user`, `session`, `account`, `verification` (Better Auth) · `accommodation`, `accommodation_photo`,
`rate_override` · `guest`, `reservation`, `reservation_status_history`, `payment` · `occupancy`,
`block` · `setting`, `audit_log`, `notification`.

Colunas-chave por migration: 0003 `occupancy` (+EXCLUDE) · 0004 reservas · 0005 `block`/`setting` ·
0006 `payment` + `reservation.internal_note` + estados check-in/out · 0007 `notification` ·
0008 `accommodation_photo`.

## 2. Lacunas (Gaps) e prioridade

| # | Gap | Prioridade | Fase |
|---|---|---|---|
| G1 | **Availability Engine** unificado (reservas+bloqueios+iCal Google/Airbnb/Booking) | P1 | Fase A (design agora) / Fase B (impl. V2) |
| G2 | **Configurações em seções/tabs** (pousada, operação, financeiro/reservas, integrações) | P1 | 16 |
| G3 | **Hóspedes = CRM leve** (documento, aniversário, histórico, ticket médio, VIP/Blacklist) | P1 | 17 |
| G4 | Dashboard "Receita do mês" + regra dos 5s | P1 | 16 (parcial ✅) |
| G5 | **Upload binário de fotos** (Supabase Storage) — hoje é por URL | P2 | 18 |
| G6 | **Fidelidade / RBAC / mensageria** (Fase 13) | P2 | 19 |
| G7 | Portal do cliente (login por link mágico) | P2 | 11 (pós-CRM) |
| G8 | Hardening, retenção LGPD, rate-limit persistente, deploy | P0 p/ produção | 14 |
| G9 | Pagamentos online (Mercado Pago), MFA, canais iCal | V2 | 15+ |

## 3. Availability Engine — desenho (estudo; implementação na Fase B/V2)

**Objetivo:** uma única fonte de verdade de disponibilidade que combine:
1. **Reservas + bloqueios internos** (já no `occupancy` — a base atual).
2. **Google Calendar** (import/export via iCal `.ics`).
3. **Airbnb / Booking** (import/export via iCal — endpoints `/api/ical/export` e leitura de URLs `.ics`).

**Arquitetura proposta (sem quebrar o núcleo atual):**
- `AvailabilityEngine.isFree(accId, range)` passa a considerar `occupancy` **e** eventos externos
  materializados em uma tabela nova `external_busy` (source=GOOGLE|AIRBNB|BOOKING, `during` daterange,
  uid do evento iCal). O site público e o painel consultam **só o Engine** (já é quase o caso).
- **Importação:** rotina lê as URLs `.ics` cadastradas em `setting`/tabela `ical_source`, faz parse
  (biblioteca `node-ical`), e faz upsert em `external_busy` por `uid` (dedupe). Sem cron: sync
  sob demanda (ao abrir o calendário/dashboard) + botão "Sincronizar agora"; cron opcional depois.
- **Exportação:** `GET /api/ical/export/{token}.ics` gera um feed com as reservas/bloqueios ativos
  (token não-enumerável por acomodação), para colar no Airbnb/Booking/Google.
- **Anti-overbooking cruzado:** ao criar reserva, o Engine revalida contra `occupancy` **e**
  `external_busy` dentro da transação; conflito → 409. iCal é "best-effort" (as OTAs não travam em
  tempo real), então a janela de import curta + alerta de conflito é o mitigador.

**Riscos:** iCal é polling (latência de minutos/horas nas OTAs) → risco de double-booking entre canais
é inerente ao iCal (não ao nosso código); mitigar com sync frequente + notificação de conflito.
**Decisão:** desenhar agora, implementar como **Fase B (V2)** junto aos canais.

## 4. Recomendações imediatas (implementadas nesta rodada)
- Menu mobile (portal) · fotos por acomodação · reservas confirmadas no calendário/painel ·
  diagnóstico do financeiro (cold-start do Supabase free; carrega em ~2s quando quente).

## 5. Observação de ambiente
Supabase free tem **cold-start severo** (1ª query após ocioso ~90s). Não é bug de código; some no
tier pago/produção. `next build` não toca o DB e é o validador estático confiável.
