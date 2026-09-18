# Deploy & Ambientes — Casa Carram

Estratégia de dois ambientes com **bancos separados** e pipeline **dev → prod com aprovação**.

```
develop ──push──▶ CI (lint/typecheck/test/build) ──▶ Deploy DEV   (automático)   ──▶ Supabase DEV
main    ──push──▶ CI                              ──▶ Deploy PROD  (APROVAÇÃO)    ──▶ Supabase PROD
```

- **DEV**: cada push em `develop` roda o CI e publica um deploy de desenvolvimento contra o **banco de DEV**. Serve para prospectar/demonstrar antes de existir produção.
- **PROD**: cada push em `main` **pausa e espera a sua aprovação** (GitHub Environment `production`). Aprovado, migra o **banco de PROD** e publica em produção — automático a partir daí.

Fluxo recomendado: trabalhar em `develop` → validar no deploy DEV → abrir PR `develop → main` → ao aprovar/mergear, o deploy PROD aguarda sua aprovação no Actions.

---

## 1. Criar o banco de DEV (Supabase)

Hoje só existe 1 projeto Supabase (o de produção). Crie um **segundo projeto** para DEV:

1. https://supabase.com/dashboard → **New project** (ex.: `casa-carram-dev`), mesma região do prod.
2. SQL Editor → habilite as extensões: `create extension if not exists btree_gist;` e `create extension if not exists pgcrypto;`
3. Pegue as connection strings (Project Settings → Database):
   - **DATABASE_URL** = Transaction pooler (porta **6543**).
   - **DIRECT_URL** = Session pooler (porta **5432**).
4. As migrations são aplicadas automaticamente pelo pipeline no primeiro deploy DEV (ou rode local: `DIRECT_URL=<dev> npm run db:migrate`).

> **`.env.local` do desenvolvedor** passa a apontar para o **banco de DEV** (não mais o de prod).
> O de PROD fica só nos secrets do GitHub Environment `production`.

## 2. Secrets no GitHub (por Environment)

Repo → **Settings → Environments** → crie `development` e `production`.

No Environment **`production`**, marque **Required reviewers** (você) — isso cria a **aprovação manual** antes do deploy de produção.

Em cada Environment, adicione os **secrets**:

| Secret | development | production |
|---|---|---|
| `DATABASE_URL` | pooler 6543 do **DEV** | pooler 6543 do **PROD** |
| `DIRECT_URL` | pooler 5432 do **DEV** | pooler 5432 do **PROD** |
| `VERCEL_TOKEN` | token da Vercel | token da Vercel |
| `VERCEL_ORG_ID` | do `vercel link` | idem |
| `VERCEL_PROJECT_ID` | do `vercel link` | idem |

> Sem `VERCEL_TOKEN`, o passo de deploy é **pulado** (o job fica verde). Você pode configurar aos poucos: primeiro as migrations (só `DATABASE_URL`/`DIRECT_URL`), depois a Vercel.

### Variáveis de aplicação (na Vercel, por ambiente)
Na Vercel (Project → Settings → Environment Variables), configure **por ambiente** (Production × Preview):
`DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (a URL pública daquele ambiente),
`SUPABASE_URL` (**a URL do projeto**, não a chave), `SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`,
`NEXT_PUBLIC_SITE_URL`.

## 3. Vercel (uma vez)

```bash
npm i -g vercel
vercel link           # conecta a pasta ao projeto Vercel; gera .vercel/project.json
cat .vercel/project.json   # copie "orgId" e "projectId" para os secrets do GitHub
```
Gere um **VERCEL_TOKEN** em https://vercel.com/account/tokens.

## 4. E2E no CI (opcional, recomendado)

O E2E só roda quando existe um **banco de teste dedicado**. Para habilitar, adicione secrets no repo:
`E2E_DATABASE_URL`, `E2E_DIRECT_URL`, `E2E_BETTER_AUTH_SECRET`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
Sem eles, o job de E2E é **ignorado** (o pipeline permanece verde) e nunca roda contra produção.

## 5. Checklist de "primeira subida em DEV"
- [ ] Projeto Supabase DEV criado (+ extensões `btree_gist`/`pgcrypto`).
- [ ] Secrets `DATABASE_URL`/`DIRECT_URL` no Environment `development`.
- [ ] `.env.local` do dev apontando para o banco DEV; `npm run db:migrate` + `npm run db:seed:admin`.
- [ ] (Opcional) Vercel: `vercel link` + secrets `VERCEL_*`.
- [ ] Push em `develop` → conferir CI verde + deploy DEV.
- [ ] `production` Environment com **Required reviewers** para o gate de prod.

## Correção pendente de env
No `.env.local` atual, **`SUPABASE_URL` está com a publishable key** (`sb_publishable_…`) em vez da URL.
Corrija para `SUPABASE_URL=https://<project-ref>.supabase.co`. (A app já contorna derivando do
`DATABASE_URL`, mas o valor correto evita ambiguidade.)
