# MVP — Plano de Implementação (fases, dependências, subagents)

> Sequência de desenvolvimento do V1. **A Fase 0 (documentação) está concluída ao aprovar estes docs.**
> A **Fase 1 só inicia após aprovação explícita.** Desenvolvimento na branch **`develop`**.

## 1. Pré-requisitos da Fase 1

- **Supabase**: projeto criado; habilitar extensão **`btree_gist`**; `DATABASE_URL` (via **pooler
  Supavisor**) em `.env.local` e nas envs da Vercel; para migrations, usar conexão **session mode**
  e/ou driver com `prepare:false` (evita conflito com transaction pooling).
- **Drizzle** + **Drizzle Kit** (migrations = fonte de verdade).
- **Better Auth** com adapter Drizzle; schema gerado via `@better-auth/cli generate` e **migrado por
  Drizzle**; secrets de auth configurados.
- **Resend**: conta + **domínio remetente verificado (SPF/DKIM)** (pode correr em paralelo).
- Branch **`develop`** criada (feito).
- Estes **8 documentos aprovados**.

## 2. Fases

| Fase | Entrega | Depende de |
|---|---|---|
| **0** | Arquitetura & docs (este conjunto) | — |
| **1** | Fundação: Supabase + Drizzle + migrations + `btree_gist`; envs/secrets; CI (lint/typecheck/test) | 0 |
| **2** | Auth admin (Better Auth): gerar schema (`user`/`session`/`account`/`verification`) → migrations; login/logout/reset (Resend); `proxy.ts` + DAL; rate limit; security headers | 1 |
| **3** | Acomodações & Preços: CRUD `accommodation` + `rate_override` (exclusion constraint de não-sobreposição); telas admin | 2 |
| **4** | Disponibilidade & Ocupação: `occupancy` + **exclusion constraint**; AvailabilityService; consulta pública | 3 |
| **5** | Reservas: `guest`/`reservation`/histórico; ReservationService transacional; fluxo público (form + confirmação); e-mail; **expire-on-read/write** (Cron opcional); **testes de concorrência** | 4 |
| **6** | Painel operacional: dashboard, lista, calendário, detalhe, confirmar/cancelar, reserva manual, bloqueios, hóspedes, configurações; auditoria | 5 |
| **7** | Hardening & Observabilidade: revisão de segurança, testes de segurança/E2E, performance (Sentry opcional/pós-MVP) | 6 |
| **8** | Deploy V1: domínio, envs de produção, backups, smoke tests (Cron opcional) | 7 |
| **9 (V2)** | Pagamentos (Mercado Pago + webhooks idempotentes), `payment`/`webhook_event`, reconciliação | 5 |
| **10 (V2)** | Fotos (Supabase Storage) + conteúdo dinâmico; RBAC com papéis; MFA; pré-check-in/portal do hóspede | 3 |

**Cadeia de dependências do núcleo:** `1 → 2 → 3 → 4 → 5 → 6 → 7 → 8`. Pagamentos (9) dependem de 5;
fotos/RBAC (10) dependem de 3.

## 3. Dependências entre módulos

```
Fundação(1) ─► Auth(2) ─► Acomodações/Preços(3) ─► Disponibilidade(4) ─► Reservas(5) ─► Painel(6) ─► Hardening(7) ─► Deploy(8)
                                     └───────────────► Fotos/RBAC(10, V2)
                                                    Reservas(5) ─► Pagamentos(9, V2)
```

- **Disponibilidade e Reservas** são o caminho crítico (concorrência/anti-overbooking).
- **Preço** é pré-requisito de Reserva (cálculo server-side congelado).
- **Auth** bloqueia todo o painel (deny-by-default).

## 4. Subagents (quando a implementação começar)

| Agente | Responsabilidade | Depende de | Paralelizável com |
|---|---|---|---|
| **Database Agent** | schema Drizzle (incl. tabelas Better Auth), migrations, `btree_gist`, exclusion constraints, índices, seeds | — (começa primeiro) | — |
| **Backend Agent** | services, Route Handlers, Server Actions, transações, integração Better Auth, expire-on-read/write | Database | Frontend (após contratos de API) |
| **Frontend Agent** | telas site/admin, formulários, calendário, integração com APIs | contratos de API (Backend) | Backend (com contratos definidos) |
| **Security Agent** | revisão de auth/authz, headers/CSP, rate limit, threat model, LGPD, testes de segurança | Backend | QA |
| **QA/Playwright Agent** | E2E, teste de concorrência, cenários críticos | Backend + Frontend | Security |

**Integração pelo agente principal:** define **contratos de API/tipos** primeiro (permite Backend e
Frontend em paralelo), garante coerência entre camadas, e roda **Security + QA como portões** antes de
cada deploy. **Ordem inicial:** Database → (Backend ⟂ Frontend com contratos) → Security/QA.

## 5. Estratégia de Git

```
main      → produção/estável
develop   → desenvolvimento e integração (fases ocorrem aqui)
feature/* → funcionalidades específicas (opcional), derivadas de develop
```

Regras: nunca desenvolver direto em `main`; sem force push; PRs `feature/* → develop`; merge
`develop → main` só para release. Cada fase pode ser uma ou mais `feature/*`.

## 6. Definition of Done por fase (resumo)

- Migrations aplicam e revertem; `lint` + `typecheck` + `test` verdes; testes da fase (incl. cenários
  críticos) passam; segurança revisada; sem segredos no código; documentação atualizada.
