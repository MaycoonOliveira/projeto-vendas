# MVP — Arquitetura (Sistema de Reservas · Casa Carram)

> **Fase 0 — documentação arquitetural.** Este documento consolida a arquitetura aprovada.
> Fonte de verdade das decisões: seção **Decisões Definitivas** (abaixo).
> Escopo: sistema de reservas de **uma única pousada** (não é SaaS/multi-tenant, não é marketplace).

## 1. Contexto e objetivo

O projeto nasceu como **landing page estática premium** (Next.js 16.3.5, App Router, React 19,
Tailwind v4, TypeScript strict) que apresenta a Casa Carram e direciona para Airbnb/WhatsApp.
O objetivo é evoluir o **mesmo app Next** para um sistema de **reservas diretas** + **painel
administrativo**, priorizando: lançar rápido algo **profissional, seguro e correto**, com ênfase em
**não permitir reserva duplicada** e em **segurança/LGPD**.

**V1 sem pagamento online:** a reserva pública cria um *hold* `PENDING` (24h) que já bloqueia o
inventário; confirmação/cobrança acontecem fora do site (PIX/WhatsApp). O gateway (**Mercado Pago**) é
desenhado agora e implementado no **V2**.

## 2. Decisões Definitivas (fonte de verdade)

| Tema | Decisão |
|---|---|
| Banco | **Supabase (PostgreSQL)** — usado **apenas como banco** (sem Supabase Auth/RLS); pooler **Supavisor** |
| ORM / schema | **Drizzle ORM**; **migrations = fonte de verdade** (Postgres padrão, portável) |
| Autenticação | **Better Auth** (email/senha, **sessões em DB**, cookies seguros, revogação). Fallback documentado: Auth.js v5. **Sem Supabase Auth** |
| Hold de reserva | **24h**; `PENDING` ocupa inventário; correção por **expire-on-read/write**; **Cron opcional** (só limpeza) |
| Dados do hóspede | **Reserva = mínimo (sem CPF)** → **Pré-check-in** (identificação, CPF quando exigido) → **FNRH-ready** (sem integrar agora) |
| E-mail | **Resend** (domínio verificado SPF/DKIM antes do PROD) |
| Admin | **`/admin`** no mesmo domínio; tudo protegido; `/admin/login` público |
| Hospedagem | **Vercel** (mesmo app Next, monólito) |

## 3. Convenção do Next.js 16 (obrigatória)

O repositório versiona `AGENTS.md`/`CLAUDE.md` (mecanismo real do Next 16) exigindo **ler
`node_modules/next/dist/docs/` antes de escrever código**. Pontos que este projeto adota:

- **`middleware.ts` → `proxy.ts`** (`export default async function proxy(req)` + `config.matcher`),
  usado apenas para **checagem otimista**.
- **`cookies()` / `headers()` assíncronos** (`await cookies()`).
- **DAL** (`verifySession()` memoizado com `cache`) + **DTOs** (allowlist de campos); autorização
  **próxima da operação** (Server Actions/Route Handlers reverificam).
- **Cache Components**: rotas de disponibilidade/reserva/admin são **dinâmicas** (sem cache indevido).

## 4. Arquitetura em camadas (monólito Next na Vercel)

```
Navegador (Site público + Painel /admin)
        │ HTTPS
        ▼
Next.js 16 (Vercel)
  ├─ UI: Server Components (leitura) + Client Components (interação)
  ├─ Entrada:
  │    • Route Handlers  → APIs públicas (disponibilidade, criar/consultar reserva) e webhooks (V2)
  │    • Server Actions  → mutações do admin (autenticadas via DAL)
  │    • proxy.ts        → checagem otimista de sessão em /admin/** + security headers/CSP
  ├─ Application/Services: AvailabilityService, ReservationService, PricingService,
  │    BlockService, (PaymentService — V2)
  ├─ Domain: entidades + regras (máquina de estados da reserva, validação datas/capacidade, preço)
  └─ Persistence: repositórios via Drizzle → PostgreSQL (Supabase)
        │
        ▼
Serviços externos:
  Supabase (PostgreSQL, pooler Supavisor)   [ESSENCIAL]
  Resend (e-mail transacional)               [ESSENCIAL]
  Supabase Storage (fotos)                   [V2]
  Mercado Pago (PIX/cartão + webhook)        [V2]
  Vercel Cron (limpeza de holds)             [OPCIONAL]
```

**Princípios:** disponibilidade e preço **sempre calculados no servidor**; toda escrita passa por
**serviço + transação**; validação de entrada com **Zod**; segredos fora do código; **Better Auth** é a
única fonte de verdade de autenticação (schema versionado no Drizzle).

## 5. Componentes essenciais × adiáveis (anti-overengineering)

| Componente | Veredito | Racional |
|---|---|---|
| PostgreSQL (Supabase) | **Essencial** | núcleo de dados + garantias de concorrência |
| E-mail (Resend) | **Essencial** | confirmação de reserva |
| Better Auth | **Essencial** | proteção do painel |
| Redis | **Pode esperar** | rate limit via Better Auth + Postgres; Redis só sob abuso |
| Vercel Cron | **Pode esperar** | correção via expire-on-read/write |
| Sentry | **Pode esperar** | começa com logs da Vercel |
| Object Storage | **Pode esperar (V2)** | fotos estáticas no V1 |
| Filas/mensageria | **Pode esperar (provável nunca)** | e-mail inline; sem processamento assíncrono no V1 |

**Superfície externa do V1 = 2 serviços (Supabase + Resend).**

## 6. Escopo do produto

- **V1 (MVP):** infra/banco, auth admin (Better Auth), acomodações + preços, disponibilidade +
  `occupancy`, reserva (hold 24h) + expire-on-read/write, bloqueios, painel operacional
  (lista/calendário/detalhe/confirmar/cancelar/manual), hóspedes (leitura), configurações, auditoria,
  e-mail transacional. Fotos **estáticas**.
- **V2:** pagamento online (Mercado Pago + webhooks idempotentes), upload de fotos (Supabase Storage),
  migração de conteúdo de marketing para o banco, RBAC com papéis, MFA, pré-check-in completo/portal do
  hóspede, regras avançadas (estadia mínima, taxas, cupons).
- **Futuro:** channel manager (Airbnb/Booking via iCal), WhatsApp Business API, relatórios/BI, FNRH
  Digital.

## 7. Separação de dados do hóspede (Reserva → Pré-check-in → FNRH)

- **RESERVA** (`guest` + `reservation`): coleta **mínima** para solicitar/contatar (nome, e-mail,
  telefone, nº hóspedes, datas, observações). **Sem CPF/documento.**
- **PRÉ-CHECK-IN** (`guest_profile` + `guest_companion`): identificação completa (nascimento,
  nacionalidade, documento, **CPF quando exigido**, endereço, acompanhantes) — **só quando necessário**,
  em etapa separada, acessível apenas no painel autenticado.
- **CHECK-IN/FNRH:** modelo **preparado** para a futura FNRH Digital, **sem integrar agora**.

## 8. Documentos relacionados

- Implementação/fases: [`MVP-IMPLEMENTATION-PLAN.md`](./MVP-IMPLEMENTATION-PLAN.md)
- Banco: [`../database/DATABASE-DESIGN.md`](../database/DATABASE-DESIGN.md)
- Segurança: [`../security/SECURITY-ARCHITECTURE.md`](../security/SECURITY-ARCHITECTURE.md),
  [`../security/THREAT-MODEL.md`](../security/THREAT-MODEL.md), [`../security/LGPD.md`](../security/LGPD.md)
- API: [`../api/API-CONTRACTS.md`](../api/API-CONTRACTS.md)
- Testes: [`../testing/TEST-STRATEGY.md`](../testing/TEST-STRATEGY.md)
