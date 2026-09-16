# TEST STRATEGY — Sistema de Reservas (Casa Carram)

> Riscos convertidos em **testes executáveis**. Camadas: **unitário (Vitest)**, **integração/banco**,
> **API**, **concorrência**, **segurança**, **E2E (Playwright)** — desktop + mobile.
> O projeto já traz Vitest e Playwright configurados (landing page); estendemos para o backend.

## 1. Pirâmide de testes

- **Unitário (Vitest)**: PricingService (cálculo/overrides), validação de datas/capacidade, máquina de
  estados da reserva, helpers de auth/DTO.
- **Integração/Banco**: disponibilidade, criação transacional, **exclusion constraint**, expire-on-write,
  optimistic locking — contra um **Postgres real** (Supabase de teste / container).
- **API**: contratos dos Route Handlers (200/400/409/422/429), idempotência.
- **Concorrência**: requisições paralelas reais.
- **Segurança**: authz, IDOR, sessão revogada, brute force, manipulação de preço/datas.
- **E2E (Playwright)**: fluxos completos, desktop + mobile.

## 2. Cenários críticos (risco → teste executável)

Formato: **Dado / Quando / Então**.

### C1 — Duas reservas simultâneas (anti-overbooking) — *integração/concorrência*
- **Dado** uma acomodação livre em `[10/10, 12/10)`.
- **Quando** dois `POST /api/reservas` são disparados **em paralelo** para o mesmo período.
- **Então** exatamente **um 201** e **um 409**; há **uma única** linha `occupancy` ativa; nenhuma
  reserva órfã.

### C2 — Reserva sobreposta (proibida) — *integração*
- **Dado** reserva ativa `[10,12)`.
- **Quando** tenta-se `[11,13)`.
- **Então** **409**; nada persistido.

### C3 — Reserva adjacente (permitida) — *integração*
- **Dado** reserva ativa `[10,12)`.
- **Quando** tenta-se `[12,14)`.
- **Então** **201** (sem overlap; intervalo semiaberto).

### C4 — Bloqueio × reserva — *integração*
- **Dado** bloqueio `[10,12)`.
- **Quando** tenta-se reserva `[11,13)`.
- **Então** **409** (occupancy unifica reserva e bloqueio).

### C5 — Edição de reserva com conflito — *integração*
- **Dado** reservas X=`[10,12)` e Y=`[12,14)` ativas.
- **Quando** admin edita X para `[12,14)`.
- **Então** **409**; X inalterada. **E** com `version` desatualizada (dois admins) → **409 "recarregue"**.

### C6 — Expiração de hold — *integração*
- **Dado** um `PENDING` com `hold_expires_at` no passado ocupando `[10,12)`.
- **Quando** consulta-se disponibilidade e depois cria-se nova reserva no mesmo período.
- **Então** disponibilidade mostra **livre** (expire-on-read); a nova reserva **passa** (expire-on-write
  desativa o hold morto); o antigo fica `EXPIRED`.

### C7 — Manipulação de preço — *API/segurança*
- **Dado** um `POST /api/reservas` com um campo de preço injetado menor que o real.
- **Quando** processado.
- **Então** o servidor **ignora** o valor do cliente; `total_price_cents` == cálculo do servidor.

### C8 — IDOR na consulta de reserva — *segurança*
- **Dado** um `public_code` inexistente/alheio ou um `id` interno.
- **Quando** `GET /api/reservas/{code}`.
- **Então** **404** genérico; resposta **nunca** traz `id` interno nem PII de terceiros.

### C9 — Sessão inválida/revogada — *segurança*
- **Dado** acesso a `/admin/**` sem cookie, com cookie adulterado, ou com sessão **revogada**.
- **Quando** requisita.
- **Então** redirect/401; sessão revogada é rejeitada (checagem no DB via DAL).

### C10 — Brute force / lockout — *segurança*
- **Dado** N tentativas de login falhas.
- **Quando** excede o limite.
- **Então** rate limit/lockout ativa; erro **genérico**; login válido bloqueado durante o lockout.

### C11 — Idempotência — *API*
- **Dado** dois `POST /api/reservas` com a **mesma** `Idempotency-Key` (duplo clique).
- **Quando** processados.
- **Então** **uma** reserva criada; a segunda resposta retorna a **mesma** reserva (sem duplicar
  `occupancy`).

### C12 — Validação de datas (fronteiras) — *unit/integração*
- `check_out <= check_in` → **400**; `nights < min_nights` → **422**; data no passado → **400**;
  `[10,12)`+`[12,14)` OK; `[10,12)`+`[11,13)` **409**; máx. noites/data futura → **400**.

### C13 — Abuso de inventário (holds) — *segurança*
- **Dado** muitos `POST /api/reservas` do mesmo IP/e-mail.
- **Quando** excede o teto de `PENDING`.
- **Então** **429**/bloqueio; inventário protegido.

### C14 — `rate_override` sobreposto — *integração*
- **Dado** um override `[10,20]` para a acomodação.
- **Quando** tenta cadastrar `[15,25]`.
- **Então** **409** (exclusion constraint de não-sobreposição).

### C15 — Cancelamento libera inventário — *integração*
- **Dado** reserva CONFIRMED em `[10,12)`.
- **Quando** admin cancela.
- **Então** disponibilidade volta a ofertar `[10,12)`; `occupancy.active=false`.

### C16 — Reserva manual nasce CONFIRMED — *integração*
- **Dado** admin cria reserva manual.
- **Então** status **CONFIRMED**; ocupa inventário imediatamente (sem hold).

## 3. E2E (Playwright) — fluxos

- **E1 — Fluxo feliz público**: escolher datas/hóspedes → ver disponibilidade/preço → escolher
  acomodação → preencher dados → **confirmar** → página de confirmação + código + e-mail (mock).
- **E2 — Datas inválidas / indisponível**: mensagens corretas; sem reserva criada.
- **E3 — Login admin**: sucesso e falha (genérica).
- **E4 — Painel**: confirmar, cancelar, criar reserva manual, bloquear datas; refletem na disponibilidade.
- **E5 — Acesso protegido**: `/admin` sem sessão redireciona para login.
- Rodar **desktop + mobile** (já configurado no `playwright.config.ts`).

## 4. Dados e ambiente de teste

- **Postgres real** para integração/concorrência (constraints só existem no banco). Container local ou
  projeto Supabase de teste; aplicar **migrations Drizzle**; habilitar `btree_gist`.
- Seeds mínimos: 1–2 acomodações, alguns overrides, usuário admin (Better Auth).
- E-mail/gateway **mockados** nos testes.

## 5. CI (GitHub Actions)

- Pipeline: `lint` → `typecheck` → `test` (Vitest, incl. integração) → `build` → `e2e` (Playwright).
- **Gate de concorrência**: C1 é obrigatório e deve ser **estável** (rodar com repetições).
- **Secret scanning** (gitleaks) no CI.

## 6. Cobertura mínima antes do deploy V1

Todos os cenários **C1–C16** e **E1–E5** passando; sem erros críticos de console no E2E; revisão de
segurança concluída (ver `../security/`).
