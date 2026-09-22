# Próximas fases & Checklist de lançamento — Casa Carram

> Documento de planejamento criado em **2026-09-22**. Consolida:
> 1. O **mapeamento dos 20 itens** do checklist (o que é · como fazer · **onde no projeto**);
> 2. A **sequência priorizada** das próximas fases (amarra os itens ao `docs/roadmap.md`);
> 3. Uma **proposta de novos checks de segurança no CI** — **para sua revisão, ainda NÃO implementada**;
> 4. Uma **auditoria pré-venda** (o que ainda falta antes de prospectar em DEV).
>
> Muitos itens já estão previstos no `roadmap.md` (Fases 21–22). Aqui eles ganham
> **passo-a-passo** e o **local exato** no código. Nada neste doc altera comportamento do sistema.

---

## 1. Mapa dos 20 itens do checklist

Legenda de status: ✅ pronto · 🟡 parcial/preparado · ⛔ a fazer.

| # | Item | O que é | Como fazer | Onde no projeto | Fase | Status |
|---|------|---------|-----------|-----------------|------|--------|
| 1 | **Monitor de uptime** | Alerta se o site cair | Criar monitor externo apontando para o health check; alerta por e-mail/WhatsApp se cair > 2min | `src/app/api/health/route.ts` (já existe) + serviço externo (UptimeRobot/BetterStack) | 21.2 | 🟡 (endpoint pronto; monitor não criado) |
| 2 | **Rastreamento de erros** | Capturar exceções em produção | Instalar `@sentry/nextjs`, DSN em env, ignorar cold-start `57014` | Novo `instrumentation.ts` + `sentry.*.config.ts`; envs Vercel | 21.1 | ⛔ |
| 3 | **Backup automático** | Não perder dados | Confirmar backups do Supabase (PITR no plano) + **teste de restore** documentado | Supabase dashboard; migrations já versionadas (`drizzle/`) | 14 | 🟡 (provedor faz; restore não testado) |
| 4 | **Search Console** | Indexação no Google | Verificar domínio (DNS/meta), enviar `sitemap.xml` | `src/app/sitemap.ts` (pronto) + Google Search Console | SEO | 🟡 (sitemap pronto; não cadastrado) |
| 5 | **Erro de cobertura** | Páginas não indexadas | Ler relatório "Cobertura/Indexação" do GSC e corrigir | GSC (depende do #4); `robots.ts`/`sitemap.ts` | SEO | ⛔ (depende de #4) |
| 6 | **Google Meu Negócio** | Perfil no Google Maps/Busca | Criar/reivindicar o perfil da pousada; NAP (nome/endereço/telefone) igual ao site | Perfil externo + `src/components/seo/structured-data.tsx` (JSON-LD `LodgingBusiness`) | SEO | 🟡 (JSON-LD existe; perfil externo não) |
| 7 | **Credenciais seguras** | Segredos protegidos | Segredos só em env (Vercel), rotação, gitleaks no CI, role de banco com menor privilégio | `.gitleaks.toml`, `docs/security/db-app-role.sql`, envs Vercel | 22.3 | 🟡 (**ver blocker §4: SERVICE_ROLE_KEY no DEV**) |
| 8 | **Link na bio** | Tráfego do Instagram → reserva | Colocar link do site/`/reservar` na bio; opcional página de links | Redes sociais; `src/config/site.ts` (contatos/redes) | Marketing | ⛔ |
| 9 | **Opinião** | Avaliações de hóspedes | Pedir avaliação após o checkout (e-mail) + seção de depoimentos no site | E-mail pós-checkout (`src/lib/email.ts`); nova seção em `(site)` | 9/Mkt | ⛔ |
| 10 | **Correções** | Backlog de bugs | Endereçar itens do QA e do gap-analysis | `docs/qa-report-2026-09.md`, `docs/product-gap-analysis.md` | contínuo | 🟡 |
| 11 | **Dados do analytics** | Medir tráfego/conversão | Ativar GA4/GTM ou Vercel Analytics; a camada de eventos já existe | `src/lib/analytics.ts` (preparado, inativo) | 21.3 | 🟡 (código pronto; provedor não instalado) |
| 12 | **Palavras-chave** | SEO de conteúdo | Revisar títulos/descrições/H1 com termos ("pousada Petrópolis", etc.) | `metadata` das páginas em `src/app/(site)`, `docs/seo.md` | SEO | 🟡 |
| 13 | **Desistência** | Recuperar reserva não concluída | Medir abandono do funil (busca → escolha → dados) + e-mail de hold expirando | Eventos em `reservation-flow.tsx`; hold/`hold_expires_at` já existe | 21.3 | ⛔ |
| 14 | **Abrir no 5G** | Testar em rede móvel real | Abrir o site em 4G/5G num celular real; validar tempo de carregamento | Deploy DEV/PROD; complementa #15 | QA | ⛔ |
| 15 | **PageSpeed** | Performance/Core Web Vitals | Rodar PageSpeed Insights/Lighthouse na URL; otimizar imagens/fontes | `next/image` já usado; medir a URL Vercel | 21.3 | 🟡 |
| 16 | **Confirmações** | Confirmar reserva ao hóspede | E-mail (Resend) + WhatsApp (Z-API) ao criar/confirmar | `src/lib/email.ts`, notificação WhatsApp (inline, já funciona) | 8 | 🟡 (WhatsApp ok; revisar e-mail/domínio) |
| 17 | **Atualizar** | Manter deps atualizadas | Ativar Dependabot + revisar `npm audit` no CI | `.github/dependabot.yml` (a criar) | 22.1 | ⛔ |
| 18 | **Infos atualizadas** | Dados do negócio corretos | Manter contatos/preços/políticas atualizados via painel | `/admin/configuracoes` (Fase 16.2), `src/config/site.ts` | 16.2 | 🟡 |
| 19 | **Revisão** | Auditoria final pré-lançamento | Passe de QA + segurança + conteúdo antes de vender | `docs/product-audit.md`, este doc §4 | 14/20 | 🟡 |
| 20 | *(em branco no print)* | — | Reservado para o item que faltava na lista | — | — | — |

---

## 2. Próximas fases priorizadas (sequência recomendada)

Agrupei os 20 itens em **4 ondas**, da que mais destrava a venda para a que é polimento.
Isto complementa o `roadmap.md` (que já vai até a Fase 22) sem substituí-lo.

### Onda A — Destravar o DEV para prospecção (rápido, alto impacto)
1. **Blocker de fotos:** configurar `SERVICE_ROLE_KEY` (+ `SUPABASE_URL`) no ambiente Vercel do DEV
   → itens **#7, #16**. Sem isso, upload de foto "some" (ver §4).
2. **Analytics ligado** (#11) + **Uptime** (#1): 30 min cada, dão dados e tranquilidade na demo.
3. **PageSpeed + teste em 5G** (#15, #14): rodar e anotar o score; corrigir o que for barato.

### Onda B — Presença e captação (marketing/SEO)
4. **Search Console + cobertura** (#4, #5) → **Google Meu Negócio** (#6) → **palavras-chave** (#12).
5. **Link na bio** (#8) + **depoimentos/avaliações** (#9).

### Onda C — Robustez de produção (Fases 21–22 do roadmap)
6. **Sentry** (#2) · **Dependabot + npm audit** (#17) · **Backups testados** (#3).
7. **Segurança contínua no CI** (proposta §3).

### Onda D — Conversão fina
8. **Funil/desistência** (#13) + **e-mail de hold expirando** (recupera reserva).
9. **Revisão final** (#19) — passe de QA/segurança/conteúdo antes de fechar a venda.

Dependências: `#4 → #5`; `#4 → #6`; Sentry (#2) habilita medir #13; #1/#11/#15 são independentes (fazer já).

---

## 3. PROPOSTA — novos checks de segurança no CI (revisar antes de implementar)

> **Você pediu para eu trazer isto antes de implementar. Nada abaixo foi adicionado ao
> `.github/workflows/` ainda.** Hoje o CI já tem: lint, typecheck, testes, build, **gitleaks**
> (secret scanning) e **E2E condicional**. As adições abaixo cobrem *variáveis expostas* e
> *outros vetores*. Marque quais aprova.

| # | Check | O que pega | Como | Custo | Recomendação |
|---|-------|-----------|------|-------|--------------|
| P1 | **`npm audit` (falha em high/critical)** | Dependências vulneráveis | step `npm audit --audit-level=high` no job `quality` | grátis, ~10s | **Forte** (hoje há 4 vulns moderate) |
| P2 | **Dependabot** | Deps desatualizadas/vulneráveis (PRs automáticos) | `.github/dependabot.yml` (npm + github-actions, semanal) | grátis | **Forte** (item #17) |
| P3 | **CodeQL (SAST)** | Falhas de código (injection, XSS, path traversal) | workflow `github/codeql-action` (JS/TS) | grátis, ~3-5min | **Forte** |
| P4 | **Checar `.env*` no tree** | Variáveis expostas commitadas | step que roda `git ls-files` e falha se achar `.env`/`.env.local` (só `.env.example` permitido) | grátis, ~1s | **Forte** (foco do seu pedido) |
| P5 | **Pin de actions por SHA** | Supply-chain (action adulterada) | trocar `@v4` por SHA + Dependabot atualiza | grátis | Média (bom, mas trabalhoso) |
| P6 | **`eslint-plugin-security`** | Padrões inseguros em JS (regex/eval/etc.) | plugin no ESLint (já roda no CI) | grátis | Média |
| P7 | **OSV-Scanner / Trivy (fs)** | CVEs em deps + IaC | action oficial (`google/osv-scanner-action`) | grátis, ~1min | Média (sobrepõe P1) |
| P8 | **SBOM (`npm sbom`)** | Inventário de dependências (auditoria) | step gera `sbom.json` como artefato | grátis | Baixa (nice-to-have; item #22.2) |
| P9 | **Headers de segurança (smoke)** | CSP/HSTS ausentes após build | teste que valida headers do `proxy.ts` | grátis | Média |

**Sugestão mínima de alto valor (se quiser só o essencial):** **P1 + P2 + P4 + P3**.
Me diga "implementa P1, P2, P4" (ou o conjunto que preferir) e eu adiciono num PR separado,
sem tocar no resto do pipeline.

---

## 4. Auditoria pré-venda — o que ainda falta (para prospectar em DEV)

### 🔴 Blocker (impede demonstrar fotos)
- **`SERVICE_ROLE_KEY` ausente no deploy DEV (Vercel).** Confirmado: a API de disponibilidade do
  DEV (`reservashouse.vercel.app`) retorna `photos: []` para as duas acomodações. O upload só grava a
  foto **após** subir ao Storage; sem a chave, o upload falha e "nada aparece".
  **Ação:** Vercel → Project → Settings → Environment Variables → adicionar `SERVICE_ROLE_KEY`
  (e conferir `SUPABASE_URL`) no ambiente do DEV → redeploy. Depois, subir fotos reais das
  acomodações pelo painel. *(A tela de edição agora avisa quando o Storage não está configurado.)*
  Localmente a chave existe e o pipeline foi testado de ponta a ponta (upload → galeria → público).

### 🟡 Recomendado antes da venda
- **Conteúdo real:** descrições das acomodações estão `null` no DEV; cadastrar textos + fotos reais.
- **E-mail transacional:** verificar domínio remetente (SPF/DKIM) no Resend para as confirmações (#16).
- **Analytics + Uptime ligados** (#11, #1) — mostram profissionalismo e geram métrica de demo.
- **PageSpeed** rodado e anotado (#15); corrigir imagens pesadas se houver.
- **Revisão de conteúdo/SEO** (títulos, telefone, endereço, política de privacidade já existe).

### ✅ Já sólido (bom argumento de venda)
- Anti-overbooking (exclusion constraint + transação + idempotência), auth com sessão revogável,
  rate limit, CSP/headers, auditoria append-only, LGPD documentada, testes (unit + E2E condicional),
  CI com secret scanning, WhatsApp de nova reserva funcionando, painel operacional completo.

---

## 5. Próximo passo sugerido
1. Você configura o `SERVICE_ROLE_KEY` no Vercel DEV (blocker de fotos).
2. Me diz **quais checks de CI** (§3) aprova → eu implemento num PR.
3. Escolhemos a **Onda A** (§2) para eu começar a executar (Analytics + Uptime + PageSpeed).
