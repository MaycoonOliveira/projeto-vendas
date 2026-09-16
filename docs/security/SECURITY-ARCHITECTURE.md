# SECURITY ARCHITECTURE — Sistema de Reservas (Casa Carram)

> Segurança como requisito de primeira classe. Base: **Better Auth** (auth) + padrões do **Next.js 16**
> (`proxy.ts`, DAL, DTOs, `await cookies()`). Fonte única de auth = Better Auth (schema no Drizzle).

## 0. Divisão de responsabilidades

| Responsabilidade | Better Auth | Aplicação (nós) |
|---|---|---|
| Shape de `user/session/account/verification` | ✅ (schema gerado) | versiona no Drizzle + migra |
| Hash de senha (scrypt/argon2) | ✅ | — |
| Sign-in/out, sessão em DB, **revogação** | ✅ | expõe via DAL |
| **Reset de senha** (verification + callback) | ✅ | envia e-mail via **Resend** |
| Cookies seguros | ✅ (config) | endurece opções (`__Host-` quando compatível) |
| **Rate limit** de auth | ✅ (nativo) | store persistente + limites; complementa endpoints públicos |
| CSRF dos endpoints de auth | ✅ | Server Actions próprias: SameSite + Origin |
| **Autorização por papel** (`role`) | — | **DAL** no servidor |
| **CSP / security headers** | — | `proxy.ts` |
| **Auditoria** (`audit_log`) | hooks | grava e protege (append-only) |
| **Lockout** (opcional) | rate limit | additionalFields + hook |
| Least-privilege no banco | — | roles do Postgres |

## 1. Autenticação (admin) — Better Auth

- **Usuário admin** = registro em `user` (hóspedes não logam). `role`/`is_active` como *additionalFields*.
- **Senha**: hash gerido pela lib (scrypt padrão; argon2 se configurado) na tabela `account`. Política:
  mínimo **12 caracteres**; sem regras de composição inúteis; opcional checagem contra vazamentos
  (**HIBP k-anonymity**).
- **Sessão**: persistida em `session` (DB) ⇒ **revogável** (`revokeSession`/`revokeSessions`).
  `expiresIn` (absoluta) + `updateAge` (renovação). Rotação de token no login.
- **Reset de senha**: fluxo do Better Auth (tabela `verification`, token de **uso único** e TTL curto,
  30–60 min), e-mail via **Resend** (callback `sendResetPassword`). **Invalidar todas as sessões** ao
  concluir a troca. Respostas **sempre genéricas** (anti-enumeração: "se existir, enviamos").
- **MFA/2FA**: **[V2]** (plugin do Better Auth).

## 2. Sessão e cookies

- Cookie de sessão: **httpOnly**, **Secure** (prod), **SameSite=Lax**, `Path=/`.
- **`__Host-`**: aplicar o prefixo **quando compatível** com a config de cookies do Better Auth (exige
  `Secure`, `Path=/`, sem `Domain`). Se a versão não suportar diretamente, manter
  httpOnly+Secure+SameSite+`Path=/` (proteção equivalente) e documentar.
- **Sem** armazenamento de sessão no `localStorage`; token só em cookie httpOnly.
- Expiração: idle + absoluta; logout deleta/expira a sessão no DB (revogação real).

## 3. Autorização

- **Deny-by-default** em `/admin/**`.
- **`proxy.ts`** (Next 16): **checagem otimista** — verifica presença do cookie de sessão e redireciona
  `/admin/**` para `/admin/login`. **Nunca** é a autorização real (roda em prefetch; não acessa DB).
- **DAL** (`app/lib/dal.ts`): `verifySession()` memoizado com `cache()` chama
  `auth.api.getSession({ headers: await headers() })` (**checagem segura no DB**), redireciona se ausente
  e retorna `{ userId, role }`. **Server Actions, Route Handlers e páginas** chamam `verifySession()`
  (e checam `role` quando aplicável) **próximo da operação**.
- **DTOs**: respostas retornam apenas campos necessários (allowlist), nunca a linha inteira.

## 4. Segurança de API

- **Validação Zod** em toda entrada (Route Handlers e Server Actions). Limites de payload.
- **Preço e disponibilidade sempre no servidor** (ignora qualquer valor vindo do cliente).
- **CORS** restrito à própria origem. **CSRF**: preferir **Server Actions** (proteção de origem embutida
  do Next 16) + checagem de `Origin/Referer` + SameSite; o `POST /api/reservas` é público (sem sessão) e
  protegido por rate limit + anti-bot.
- **SQL injection**: queries **parametrizadas** (Drizzle). **Mass assignment**: allowlist explícita de
  campos por operação.
- **Tratamento de erro**: mensagens **genéricas** ao cliente; log detalhado no servidor (sem stack/SQL);
  sem páginas de erro detalhadas em prod.

## 5. Headers de segurança & CSP (via `proxy.ts`)

- **CSP baseada em nonce** (sem `unsafe-inline` para scripts). Nonce gerado no `proxy.ts` e propagado.
- **HSTS** (`Strict-Transport-Security`), `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors`.
- `dangerouslySetInnerHTML` só para **JSON-LD** com dados controlados; **nunca** conteúdo do hóspede. Rich
  text futuro → **sanitizar no servidor**.

## 6. Rate limiting & brute force

- **Auth**: rate limit **nativo do Better Auth** com **store persistente** (memória não persiste entre
  lambdas na Vercel). Limites sugeridos: login 5/15min por conta + 20/15min por IP; reset idem.
- **Endpoints públicos**: `POST /api/reservas` 10/h por IP; `GET /api/disponibilidade` 60/min por IP;
  `GET /api/reservas/{code}` limitado (anti-enumeração). Backend do limiter no **Postgres** no V1 (Redis
  só sob abuso).
- **Lockout opcional**: `failed_login_count`/`locked_until` (additionalFields no `user`) + hook de
  sign-in. Mensagens genéricas.
- **Abuso de inventário** (holds prendendo datas): TTL curto (24h) + rate limit + **teto de PENDING por
  IP/e-mail** + visibilidade no painel.

## 7. IDOR / BOLA

- Reserva pública por **`public_code`** aleatório (~128 bits); **nunca** expor `id` interno.
- Endpoints admin sempre atrás de `verifySession()`. Respostas via **DTO** (não vazam PII de terceiros
  nem campos internos).
- **Sem** endpoint público de listagem de reservas; consulta pública devolve só a **própria** reserva
  (dados mínimos; PII completa mascarada/omitida).

## 8. Segredos & banco

- Segredos em **env/secret store** (Vercel envs; `.env.local` local, nunca commitado). **Secret scanning
  no CI** (gitleaks).
- **Role de aplicação com privilégio mínimo** (sem DDL/DROP em prod); **migrations com role separada**.
  TLS obrigatório. `audit_log` **append-only** (sem UPDATE/DELETE pela role da app).
- Backups automáticos do Supabase + verificação de restauração.

## 9. Logs & auditoria

- **Logs estruturados** sem PII sensível: **não logar** senhas, tokens, cookies, PII completa. Logar
  hóspede por `id`/`public_code`. **IP** é PII (LGPD): logar por segurança com **retenção curta (~90
  dias)**.
- **`audit_log`** para: login (sucesso/falha), logout, reset (pedido/conclusão), lockout; reserva
  (criar/confirmar/cancelar/editar/expirar); bloqueio (criar/remover); acomodação (criar/editar/excluir);
  **alteração de tarifa/preço**; alteração de `setting`; (V2) pagamentos/estornos e gestão de usuários.

## 10. LGPD (operacional) — ver `LGPD.md`

- **Minimização**: reserva coleta o mínimo; pré-check-in coleta identificação **só quando necessário**.
- **CPF/documento**: fora do formulário de reserva; no pré-check-in (quando exigido), acesso **só no
  painel autenticado**, **nunca** via `public_code`, com proteção adicional.
- Retenção por finalidade (definir antes do PROD), expurgo/anonimização, direitos do titular.

## 11. Riscos de implementação (auth)

- **Versão/maturidade do Better Auth** → pinar versão; gerar schema via CLI; migrar por Drizzle; fallback
  Auth.js v5.
- **`__Host-`** pode não ser suportado diretamente → validar; senão usar atributos seguros equivalentes.
- **Rate limit serverless** → store persistente (DB/secondary storage).
- **Supavisor (transaction pooling) × prepared statements** → migrations em session mode / `prepare:false`.
- **Runtime**: handler de auth (`app/api/auth/[...all]/route.ts`) exige **runtime Node** (não edge).
