# DATABASE DESIGN — Sistema de Reservas (Casa Carram)

> **PostgreSQL (Supabase)** · **Drizzle ORM** · **migrations = fonte de verdade**.
> Este documento é o desenho lógico. A implementação (Fase 1+) deve gerar as migrations correspondentes.

## 0. Convenções

- PK: `id uuid` default `gen_random_uuid()` (extensão `pgcrypto`), salvo tabelas do Better Auth (seguem
  o schema gerado pela lib).
- Timestamps: `created_at timestamptz not null default now()`, `updated_at timestamptz`.
- Datas de estadia: tipo **`date`** (sem hora) — evita bugs de fuso; regra de negócio em
  `America/Sao_Paulo`.
- Dinheiro: **inteiro de centavos** (`*_cents int`), `currency` = `'BRL'`. Nunca float.
- Enums: colunas `text` + `CHECK (... in (...))` (simples de evoluir) — ou enums nativos, à escolha na
  implementação, desde que consistentes.
- Soft delete só onde há valor histórico (ex.: `accommodation.deleted_at`). Reservas **nunca** são
  apagadas — mudam de `status`.
- Extensões necessárias: **`btree_gist`** (exclusion constraints com `=` + `&&`), `pgcrypto`.

## 1. Extensões e por que precisamos delas

```sql
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists btree_gist;  -- exclusion constraint (accommodation_id WITH =, during WITH &&)
```

> No Supabase, habilitar `btree_gist` (Dashboard → Database → Extensions, ou via migration). As migrations
> Drizzle devem incluir esses `create extension` no início.

## 2. Autenticação — tabelas gerenciadas pelo Better Auth (NÃO duplicar)

> **Fonte única de verdade de auth.** O schema é **gerado** (`@better-auth/cli generate`) e **versionado
> no Drizzle**; **migrations Drizzle criam/alteram** estas tabelas; o Better Auth as **usa em runtime**
> via `drizzleAdapter`. **Não** criar `admin_user`/`admin_session`/`password_reset_token` próprios.

| Tabela | Papel | Campos principais |
|---|---|---|
| **`user`** | usuário administrativo (hóspedes não logam) | `id`, `name`, `email` (unique), `email_verified`, `image`, timestamps **+ additionalFields**: `role` ('ADMIN'), `is_active bool` default true, *(opcional)* `failed_login_count int`, `locked_until timestamptz null` |
| **`session`** | sessão persistida (revogável) | `id`, `user_id FK→user`, `token`, `expires_at`, `ip_address`, `user_agent`, timestamps |
| **`account`** | credencial/OAuth (guarda hash de senha para email&password) | `id`, `user_id FK→user`, `account_id`, `provider_id`, `password null`, … |
| **`verification`** | tokens de reset de senha / verificação / OTP | `id`, `identifier`, `value`, `expires_at`, timestamps |

- **`role`/`is_active`** são **additionalFields no `user`** (config do Better Auth) — **sem tabela
  extra**. Base para RBAC no V2.
- **Lockout** (`failed_login_count`/`locked_until`) é **opcional**: additionalFields no `user` + hook de
  sign-in. Brute-force primário = **rate limit nativo do Better Auth** (store persistente).
- **Índices**: os padrões do Better Auth (unique em `user.email`, FK `session.user_id`, `session.token`);
  acrescentar índice em `session.expires_at` se necessário para limpeza.

## 3. Domínio — tabelas de negócio

### 3.1 `accommodation` — o que se vende
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text | **unique** |
| `name` | text | not null |
| `description` | text | |
| `capacity` | int | **CHECK > 0** |
| `base_price_cents` | int | **CHECK >= 0** |
| `min_nights` | int | default 1, CHECK >= 1 |
| `is_active` | bool | default true |
| `sort_order` | int | default 0 |
| `deleted_at` | timestamptz null | soft delete |
| timestamps | | |

Índices: `unique(slug)`, `(is_active)`.
*(V1: fotos/comodidades permanecem estáticas em `src/data`; V2 migram para tabelas próprias.)*

### 3.2 `rate_override` — tarifas por período (sazonalidade)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `accommodation_id` | uuid FK→accommodation | ON DELETE CASCADE |
| `start_date` | date | |
| `end_date` | date | **CHECK start_date <= end_date** |
| `during` | daterange | **GENERATED** `daterange(start_date, end_date, '[]')` (inclui `end_date`, pois a tarifa vale para as noites de start a end) |
| `price_cents` | int | **CHECK >= 0** |
| `label` | text | |
| timestamps | | |

**Não-sobreposição (garantia):**
```sql
ALTER TABLE rate_override
  ADD CONSTRAINT rate_override_no_overlap
  EXCLUDE USING gist (accommodation_id WITH =, during WITH &&);
```
→ impede cadastrar/editar overrides que **se sobreponham** para a mesma acomodação. Garante **≤ 1
override por noite** ⇒ precificação **determinística** (ver §7 de PRICING). Conflito → **409**.
Índice adicional: `(accommodation_id, start_date, end_date)`.

### 3.3 `guest` — hóspede: **apenas contato/reserva** (mínimo LGPD)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `full_name` | text | not null |
| `email` | citext | índice (não-unique: mesmo e-mail pode ter várias reservas) |
| `phone` | text | |
| `notes` | text null | observações do hóspede |
| timestamps | | |

**Não guarda** documento/CPF/endereço (ver `guest_profile`).

### 3.4 `guest_profile` — **Pré-check-in** (identificação; preenchimento opcional/posterior)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `guest_id` | uuid FK→guest | **unique** (1:1) |
| `birth_date` | date null | |
| `nationality` | text null | |
| `document_type` | text null | CHECK in ('CPF','RG','PASSPORTE','OUTRO') |
| `document_number` | text null | proteção adicional quando usado |
| `cpf` | text null | **só quando exigido**; proteção adicional |
| `address` | jsonb null | logradouro/cidade/UF/CEP |
| `phone` | text null | |
| `email` | citext null | |
| `completed_at` | timestamptz null | quando o pré-check-in foi concluído |
| timestamps | | |

Acesso **só via painel autenticado**; **nunca** exposto via `public_code`. Índice: `(guest_id)`.

### 3.5 `guest_companion` — acompanhantes (pré-check-in, quando necessário)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `reservation_id` | uuid FK→reservation | ON DELETE CASCADE |
| `full_name` | text | |
| `birth_date` | date null | |
| `document_type` | text null | |
| `document_number` | text null | |
| `is_child` | bool | default false |
| timestamps | | |

Índice: `(reservation_id)`.

### 3.6 `reservation` — a reserva
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `public_code` | text | **unique**, aleatório (~128 bits) — anti-IDOR/enumeração |
| `accommodation_id` | uuid FK→accommodation | ON DELETE RESTRICT |
| `guest_id` | uuid FK→guest | ON DELETE RESTRICT |
| `check_in` | date | |
| `check_out` | date | **CHECK check_out > check_in** |
| `guests_count` | int | **CHECK > 0** |
| `nights` | int | derivado (`check_out - check_in`); pode ser coluna gerada ou calculado no app |
| `total_price_cents` | int | **congelado** no ato; CHECK >= 0 |
| `price_breakdown` | jsonb null | tarifa por noite (auditoria/transparência) |
| `currency` | text | default 'BRL' |
| `status` | text | CHECK in ('PENDING','CONFIRMED','CANCELLED','EXPIRED','COMPLETED','NO_SHOW') |
| `source` | text | CHECK in ('WEBSITE','MANUAL') |
| `hold_expires_at` | timestamptz null | só para `PENDING` de `WEBSITE` = criação + **24h** |
| `version` | int | default 0 — **optimistic locking** (incrementa a cada update) |
| `notes` | text null | notas internas do admin |
| `created_by_user_id` | uuid null FK→user | quando criada manualmente |
| `cancelled_reason` | text null | |
| timestamps | | |

Índices: `unique(public_code)`, `(accommodation_id, check_in, check_out)`, `(status)`, `(guest_id)`,
`(hold_expires_at)` (para limpeza/consulta de expirados).

### 3.7 `reservation_status_history` — trilha de estados
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `reservation_id` | uuid FK→reservation | ON DELETE CASCADE |
| `from_status` | text null | |
| `to_status` | text | |
| `changed_by_user_id` | uuid null FK→user | null = SYSTEM |
| `reason` | text null | |
| `created_at` | timestamptz | |

Índice: `(reservation_id)`.

### 3.8 `block` — bloqueio manual de datas
| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `accommodation_id` | uuid FK→accommodation | |
| `start_date` | date | |
| `end_date` | date | **CHECK end_date > start_date** |
| `reason` | text | |
| `created_by_user_id` | uuid FK→user | |
| timestamps | | |

### 3.9 `occupancy` — **ledger de ocupação (garantia anti-overbooking)**
> **Status (Fase 4 — implementado):** migration `0003_skinny_blacklash.sql`. Guardamos
> `check_in`/`check_out` como colunas `date` e `during` é uma coluna **GERADA**
> `daterange(check_in, check_out, '[)')` (Drizzle não modela coluna gerada de daterange nem EXCLUDE
> parcial → apêndice SQL na migration, como em `rate_override`). A EXCLUDE é **parcial** (`WHERE active`).
> As colunas `reservation_id`/`block_id` existem sem FK: as FKs entram nas Fases 5 (`reservation`) e
> 6 (`block`), quando as tabelas-alvo passam a existir. `AvailabilityService` (`src/lib/services/availability.ts`)
> faz a leitura; `expire-on-read` de holds PENDING entra na Fase 5.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `accommodation_id` | uuid FK→accommodation | |
| `during` | daterange | `daterange(check_in, check_out, '[)')` — **semiaberto** |
| `source_type` | text | CHECK in ('RESERVATION','BLOCK') |
| `reservation_id` | uuid null FK→reservation | ON DELETE CASCADE |
| `block_id` | uuid null FK→block | ON DELETE CASCADE |
| `active` | bool | default true |
| `created_at` | timestamptz | |

**Constraints:**
```sql
-- exatamente uma origem preenchida
ALTER TABLE occupancy ADD CONSTRAINT occupancy_one_source
  CHECK ( (reservation_id is not null)::int + (block_id is not null)::int = 1 );

-- barreira anti-overbooking: nenhuma sobreposição ATIVA na mesma acomodação
ALTER TABLE occupancy ADD CONSTRAINT occupancy_no_overlap
  EXCLUDE USING gist (accommodation_id WITH =, during WITH &&) WHERE (active);
```
Índices: GiST `(accommodation_id, during)` (implícito pela constraint), `(active)`,
`(reservation_id)`, `(block_id)`.

### 3.10 `setting` — configurações da pousada
`id`, `key` (unique), `value jsonb`, `updated_by_user_id null`, `updated_at`.
Ex.: nome, contatos, check-in/out, **janela de hold (24h)**, política de cancelamento (texto).

### 3.11 `audit_log` — auditoria de ações sensíveis (**nosso**, não do Better Auth)
`id`, `actor_type` ('USER','SYSTEM','GUEST'), `actor_id null` (**→ `user.id`** quando USER), `action`,
`entity_type`, `entity_id`, `metadata jsonb` (**sem dados sensíveis**), `ip null`, `created_at`.
Índices: `(entity_type, entity_id)`, `(created_at)`. **Append-only** (role da app sem UPDATE/DELETE aqui).
Eventos de auth (login/logout/reset/lockout) gravados via **hooks do Better Auth**.

### 3.12 (V2) `payment` e `webhook_event`
- `payment`: `id`, `reservation_id FK`, `provider` ('MERCADO_PAGO'), `provider_payment_id`, `method`
  ('PIX','CARD'), `amount_cents`, `status` ('PENDING','APPROVED','REJECTED','REFUNDED','CANCELLED'),
  `idempotency_key` **unique**, `raw_event jsonb null`, timestamps. Índices: `unique(provider,
  provider_payment_id)`, `unique(idempotency_key)`, `(reservation_id)`.
- `webhook_event`: `id`, `provider`, `provider_event_id` **unique**, `type`, `payload jsonb`,
  `processed_at null`, `signature_valid bool`, `created_at`. Índice: `unique(provider,
  provider_event_id)` (dedupe/replay).

## 4. Integridade referencial

- FKs de reservas/histórico/ocupação para `accommodation`/`guest`/`user`: `ON DELETE RESTRICT`
  (preservar histórico); `occupancy`/`companion`/`history` para a reserva: `ON DELETE CASCADE`.
- `accommodation` usa **soft delete** (`deleted_at`) — não apagar acomodações com reservas.
- Reservas nunca apagadas (mudam de `status`); `public_code` aleatório impede enumeração.

## 5. Concorrência & anti-overbooking (núcleo)

**Garantia no banco** (não no frontend): a **exclusion constraint** `occupancy_no_overlap` impede que
existam duas ocupações **ativas** sobrepostas para a mesma acomodação — cobre reserva×reserva,
reserva×bloqueio e bloqueio×bloqueio, **atomicamente**, no `INSERT`/`UPDATE`.

**Sequência transacional (criar reserva) — livre de corrida (READ COMMITTED basta):**
```sql
BEGIN;
-- 0. Idempotência: se existe reserva para o Idempotency-Key → retorna a existente e encerra.

-- 1. Serializa reservas concorrentes da MESMA acomodação:
SELECT id FROM accommodation WHERE id = :acc AND is_active AND deleted_at IS NULL FOR UPDATE;

-- 2. expire-on-write: desativa ocupações de holds EXPIRADOS que colidem com o período
UPDATE occupancy o SET active = false
  FROM reservation r
 WHERE o.reservation_id = r.id AND o.accommodation_id = :acc AND o.active
   AND r.status = 'PENDING' AND r.hold_expires_at < now()
   AND o.during && daterange(:ci, :co, '[)');
-- marcar essas reservas como EXPIRED + history (opcionalmente aqui ou em limpeza)

-- 3. (defensivo) revalida disponibilidade → 409 limpo se ainda ocupado por ATIVO válido.

-- 4. INSERT guest (ou reusa) + INSERT reservation(PENDING, hold_expires_at = now()+24h)
--    + INSERT occupancy(active=true). A EXCLUSION CONSTRAINT é a barreira final:
--    sobreposição ativa → erro → ROLLBACK → API responde 409.

-- 5. reservation_status_history + audit_log
COMMIT;
```

**Por que é livre de corrida:** o `SELECT … FOR UPDATE` na acomodação **serializa** os passos 2–4 por
unidade; concorrentes esperam e recebem **409** na revalidação/constraint. Mesmo sem o lock, a exclusion
constraint já garante unicidade (o 2º COMMIT falha); o lock troca "erro de constraint" por **espera
ordenada + 409 limpo**. `SERIALIZABLE` é opcional.

**Expire-on-read (disponibilidade):** consultas ignoram holds expirados ainda ativos:
```sql
NOT EXISTS (
  SELECT 1 FROM occupancy o LEFT JOIN reservation r ON r.id = o.reservation_id
  WHERE o.accommodation_id = a.id AND o.active
    AND o.during && daterange(:ci, :co, '[)')
    AND NOT (o.source_type='RESERVATION' AND r.status='PENDING' AND r.hold_expires_at < now())
)
```
⇒ a disponibilidade exibida coincide com o que o expire-on-write liberaria na escrita. **Cron é
opcional** (só marca `EXPIRED` em lote).

## 6. Idempotência

- `POST /api/reservas` aceita header **`Idempotency-Key`**. Estratégia: tabela leve
  `reservation_idempotency (key unique, reservation_id, created_at)` **ou** coluna `idempotency_key`
  única na `reservation`. Mesma chave → retorna a reserva já criada (evita duplicar por duplo clique/retry).
- (V2) Webhooks: dedupe por `webhook_event.provider_event_id` único (anti-replay).

## 7. Optimistic locking (edição concorrente)

- `reservation.version` incrementa a cada update; a edição envia a `version` lida; o `UPDATE ... WHERE
  id=:id AND version=:v` aplica só se a versão bate — senão **409 "recarregue"**. Combina com a
  exclusion constraint (conflito de calendário) para cobrir corrida de **dados** e de **calendário**.
- Edição de datas/acomodação: dentro de transação, `FOR UPDATE` na acomodação, expire-on-write, `UPDATE`
  da linha de `occupancy` (novo `during`/`accommodation_id`) — constraint valida; conflito → 409/rollback.

## 8. Expiração de holds

- `hold_expires_at = created_at + 24h` (apenas `PENDING` de `WEBSITE`). Reserva manual nasce `CONFIRMED`
  (sem hold).
- Correção **sem cron**: expire-on-read (consulta) + expire-on-write (transação). Cron **opcional** só
  para marcar `EXPIRED` em lote e liberar `occupancy` (cosmético/estado).

## 9. Máquina de estados (resumo; ver TEST-STRATEGY)

`PENDING → CONFIRMED|CANCELLED|EXPIRED` · `CONFIRMED → CANCELLED|COMPLETED|NO_SHOW` · terminais:
CANCELLED, EXPIRED, COMPLETED, NO_SHOW. **Ocupam inventário** (occupancy.active): PENDING, CONFIRMED (e
blocos). **Liberam**: CANCELLED, EXPIRED.

## 10. Migrations (Drizzle) — notas

- **Fonte de verdade**: as migrations Drizzle. Ordem sugerida da 1ª migration: extensões
  (`pgcrypto`, `btree_gist`) → tabelas Better Auth (do schema gerado) → tabelas de domínio → constraints
  (exclusion) → índices.
- Better Auth: `@better-auth/cli generate` produz o schema Drizzle das tabelas de auth; **commitar** e
  migrar via **Drizzle Kit** (não usar o `migrate` próprio do Better Auth como fonte concorrente).
- **Supavisor (transaction pooling)**: rodar migrations em **session mode** (porta 5432) e/ou driver
  `postgres` com `prepare:false`; runtime da aplicação pode usar o pooler de transação.
- Toda escrita crítica (reserva/bloqueio/edição) ocorre em **transação**; testes de concorrência
  obrigatórios (ver TEST-STRATEGY).
