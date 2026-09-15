# Deploy

Recomendado: **Vercel** (criadora do Next.js). Também funciona em qualquer
provedor que rode Node 20+.

## Pré-requisitos

- Repositório Git (GitHub/GitLab/Bitbucket).
- Conta na Vercel.

## Passo a passo (Vercel)

1. Faça o push do projeto para um repositório Git.
2. Na Vercel: **Add New… → Project** e importe o repositório.
3. A Vercel detecta Next.js automaticamente:
   - Build command: `next build` (padrão)
   - Output: gerenciado pela Vercel
4. **Environment Variables** — adicione:
   - `NEXT_PUBLIC_SITE_URL` = `https://SEU-DOMINIO` (sem barra no final)
5. Clique em **Deploy**.
6. Configure o **domínio** em Project → Settings → Domains.

> Sem `NEXT_PUBLIC_SITE_URL`, o site usa o domínio padrão de
> `src/config/site.ts` — atualize antes de publicar para canonical/OG/sitemap
> corretos.

## Checklist antes de publicar

- [ ] `NEXT_PUBLIC_SITE_URL` definido com o domínio final.
- [ ] Placeholders resolvidos (ver `client-content-checklist.md`).
- [ ] Imagens autorizadas/substituídas (ver `images.md`).
- [ ] Textos legais revisados.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` e `npm run test:e2e` OK.
- [ ] `npm run build` sem erros.

## Verificações locais

```bash
npm run lint && npm run typecheck && npm run test && npm run build
npm run start        # confere o build de produção em http://localhost:3000
```

## Deploy manual (alternativo)

Em um servidor Node:

```bash
npm ci
npm run build
npm run start        # porta 3000 (use um proxy reverso, ex. Nginx, na frente)
```
