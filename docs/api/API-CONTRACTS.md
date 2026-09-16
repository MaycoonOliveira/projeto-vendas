# API CONTRACTS — Sistema de Reservas (Casa Carram)

> Contratos das APIs públicas (Route Handlers) e das mutações administrativas (Server Actions).
> Regras transversais: **Zod** em toda entrada; **preço/disponibilidade calculados no servidor**;
> **DTOs** nas respostas; erros **genéricos** ao cliente; datas em `YYYY-MM-DD`; valores em **centavos**.
> Convenção de intervalo: **`[check_in, check_out)`** (check-out não é diária).

## Convenções de erro (HTTP)

| HTTP | Significado | Exemplos |
|---|---|---|
| 400 | entrada inválida | datas malformadas, checkout ≤ checkin, data no passado |
| 401 | não autenticado | acesso admin sem sessão |
| 403 | sem permissão | role insuficiente |
| 404 | não encontrado | `public_code` inexistente |
| 409 | conflito | datas indisponíveis, edição concorrente (version), override sobreposto |
| 422 | regra de negócio | capacidade excedida, `nights < min_nights` |
| 429 | rate limit | excesso de requisições |
| 500 | erro interno | mensagem genérica (log no servidor) |

Corpo de erro (exemplo): `{ "error": { "code": "UNAVAILABLE", "message": "Datas indisponíveis." } }`
(mensagens neutras; sem stack/SQL/PII).

---

## 1. APIs públicas (Route Handlers)

### 1.1 `GET /api/disponibilidade`
- **Auth/Authz**: pública.
- **Rate limit**: ~60/min por IP.
- **Request (query)**: `checkin=YYYY-MM-DD`, `checkout=YYYY-MM-DD`, `guests=int`.
- **Validações**: datas válidas; `checkout > checkin`; não no passado; `guests >= 1`; limites (máx.
  noites, máx. data futura).
- **Regra**: para cada acomodação ativa com `capacity >= guests`, disponível se **não** houver
  `occupancy` ativa sobreposta (com **expire-on-read** de holds vencidos). Preço **calculado no servidor**.
- **Response 200**:
  ```json
  { "checkin":"2026-10-10","checkout":"2026-10-12","nights":2,
    "results":[{"accommodationId":"…","slug":"…","name":"…","capacity":4,
                "totalCents":100000,"currency":"BRL","available":true}] }
  ```
- **Erros**: 400 (datas), 422 (guests/limites), 429.

### 1.2 `POST /api/reservas`
- **Auth/Authz**: pública. **Header** `Idempotency-Key: <uuid>` (recomendado).
- **Rate limit**: ~10/h por IP; **teto de PENDING por IP/e-mail** (anti-abuso de inventário).
- **Request (JSON)**:
  ```json
  { "accommodationId":"…","checkin":"2026-10-10","checkout":"2026-10-12","guestsCount":2,
    "guest":{"fullName":"…","email":"…","phone":"…","notes":"opcional"} }
  ```
  > **Nunca** aceita preço do cliente — o servidor recalcula. **Não** coleta CPF/documento (só reserva).
- **Validações**: Zod estrito; datas coerentes/não passado; `guestsCount >= 1` e **≤ capacity** (422);
  `nights >= min_nights` (422); e-mail/telefone válidos.
- **Processamento**: transação com `FOR UPDATE` na acomodação + **expire-on-write** + revalidação +
  INSERT `guest`/`reservation`(PENDING, `hold_expires_at = now()+24h`)/`occupancy` (exclusion constraint
  = barreira final) + histórico + `audit_log`. E-mail de confirmação (Resend) ao hóspede + aviso ao admin.
- **Response 201**:
  ```json
  { "publicCode":"R-XXXXXXXX","status":"PENDING","totalCents":100000,"currency":"BRL",
    "holdExpiresAt":"2026-10-11T13:00:00Z" }
  ```
- **Erros**: 400 (validação), 409 (indisponível/constraint), 422 (capacidade/min_nights), 429.
- **Idempotência**: mesma `Idempotency-Key` retorna a reserva já criada (**200**), sem duplicar.

### 1.3 `GET /api/reservas/{publicCode}`
- **Auth/Authz**: pública **por código não enumerável** (capability). Página `noindex`.
- **Rate limit**: limitado por IP (anti-enumeração).
- **Response 200 (DTO mínimo)**:
  ```json
  { "publicCode":"R-XXXXXXXX","status":"PENDING","accommodationName":"…",
    "checkin":"2026-10-10","checkout":"2026-10-12","guestsCount":2,
    "totalCents":100000,"currency":"BRL","holdExpiresAt":"…","guestFirstName":"João",
    "paymentInstructions":"…" }
  ```
  > **Nunca** retorna `id` interno, e-mail/telefone completos, documento, CPF, endereço, observações ou
  > outras reservas.
- **Erros**: 404 (genérico), 429.
- **Ações do hóspede (V1)**: **somente visualizar**. Cancelar/alterar via contato (WhatsApp).
  Autoatendimento = **V2 (portal do hóspede)**.

### 1.4 `POST /api/webhooks/pagamento` **(V2)**
- **Auth/Authz**: pública com **verificação de assinatura**. **Idempotente** por `provider_event_id`.
- **Regra**: validar assinatura; deduplicar; **consultar o provedor** (fonte de verdade); conferir valor
  == reserva; confirmar reserva só se `APPROVED`; responder **200** rápido. Nunca confiar no redirect do
  cliente.

---

## 2. Mutações administrativas (Server Actions)

> **Todas**: exigem sessão válida (**DAL `verifySession()`**), checam `role` quando aplicável,
> validam com **Zod**, aplicam **allowlist de campos** (sem mass assignment), registram **`audit_log`**,
> e usam **transação** quando alteram inventário. CSRF: Server Actions (origem) + SameSite.

| Ação | Autorização | Entrada (resumo) | Sucesso | Erros | Audit |
|---|---|---|---|---|---|
| Login | pública (fronteira) | email, senha | sessão criada + redirect | 401 genérico, 429 | ✅ (sucesso/falha) |
| Logout | sessão | — | sessão revogada | 401 | ✅ |
| Solicitar reset | pública | email | resposta **genérica** | 429 | ✅ |
| Concluir reset | token | token, nova senha | senha trocada + sessões invalidadas | 400/genérico | ✅ |
| Criar acomodação | admin | name, slug, capacity, base_price_cents, min_nights, is_active | 201 | 400/409(slug) | ✅ |
| Editar acomodação | admin | campos (allowlist) | 200 | 400/404 | ✅ |
| Excluir acomodação | admin | id | soft delete | 409 (com reservas) | ✅ |
| Criar/editar `rate_override` | admin | accommodationId, start/end, price_cents | 201/200 | 409 (**sobreposição**), 400 | ✅ (alteração de preço) |
| Criar bloqueio | admin | accommodationId, start/end, reason | 201 | 409 (sobreposição), 400 | ✅ |
| Remover bloqueio | admin | id | 200 | 404 | ✅ |
| Criar reserva manual | admin | acomodação, datas, guestsCount, guest | 201 (**CONFIRMED**) | 409/422 | ✅ |
| Confirmar reserva | admin | id, version | 200 (CONFIRMED) | 409 (version), 422 (transição) | ✅ |
| Cancelar reserva | admin | id, version, reason | 200 (CANCELLED, libera inventário) | 409/422 | ✅ |
| Editar reserva (datas/acomodação) | admin | id, version, novos campos | 200 (preço recalculado) | 409 (conflito/version), 422 | ✅ |
| Ler hóspedes / pré-check-in | admin | filtros | DTO (PII completa só aqui) | 401/403 | (acesso auditável) |
| Ler/gravar `setting` | admin | key, value | 200 | 400 | ✅ (alteração) |

## 3. Validações de domínio (compartilhadas)

- Datas: `check_out > check_in`; sem passado; dentro de limites (máx. noites/data futura).
- Capacidade: `guests_count <= accommodation.capacity`.
- Estadia mínima: `nights >= accommodation.min_nights`.
- Preço: **sempre** `PricingService` no servidor (base + overrides não-sobrepostos), congelado na reserva.
- Concorrência: exclusion constraint (`occupancy`) + `FOR UPDATE` + expire-on-write; edição com
  **optimistic locking** (`version`).

## 4. Autorização (resumo)

- `proxy.ts` = checagem **otimista** (cookie) em `/admin/**`.
- **Autorização real** = **DAL** dentro de cada Server Action/Route Handler/página (deny-by-default).
- Público: só disponibilidade, criar reserva e consultar a **própria** reserva por `public_code`.
