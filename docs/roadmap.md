# Roadmap — Casa Carram

> Integra as novas funcionalidades (auditoria de produto) ao plano original
> (`docs/architecture/MVP-IMPLEMENTATION-PLAN.md`). As Fases 0–6 estão **concluídas**. As Fases 7+
> abaixo **re-sequenciam** o plano: a operação diária e a UX crítica passam à frente do
> hardening/deploy, porque o sistema já é usado pela proprietária e há gaps que bloqueiam o uso real
> (menu mobile, dashboard operacional, check-in/out). Pagamento online permanece **V2**.

## Concluído
- **Fase 0** Arquitetura & docs · **1** Fundação (Supabase/Drizzle/CI) · **2** Auth admin ·
  **3** Acomodações & preços · **4** Disponibilidade & ocupação · **5** Reservas (anti-overbooking) ·
  **6** Painel operacional (reservas/bloqueios/calendário/hóspedes/config).

## Fase 7 — Operação diária & UX crítica  `[EM ANDAMENTO]`
Objetivo: tornar o painel um **centro de operação** e destravar o uso no celular.
- **7.1 Navegação mobile do admin** (drawer + hamburger) — **P0**.
- **7.2 Dashboard operacional**: chegadas/saídas de hoje, in-house, ocupação, itens de atenção
  (pendentes, holds expirando), **mini-calendário** de 14 dias — **P0**.
- **7.3 Toasts** de feedback nas ações do admin — P1.
- **7.4 Busca (hóspede/código) + paginação** nas listas — P1.
- **7.5 Estados de UI**: skeletons, empty/error consistentes, `aria-live` — P1.
- **7.6 Reserva pública**: stepper + validação inline + "Como funciona" na home — P1.
- Depende de: Fase 6. Habilita: 8, 9.

## Fase 8 — Ciclo de reserva & Check-in/out
- **8.1 Máquina de estados estendida**: `CHECKED_IN` (hospedado) e `CHECKED_OUT`; ações de check-in/
  check-out no detalhe e no dashboard (ver ADR-0001).
- **8.2 Nota interna** por reserva (editável, distinta da observação do hóspede).
- **8.3 Registro de pagamento manual** (tabela `payment` mínima: valor, data, método, quem
  registrou) — sem gateway; habilita "confirmar pagamento" com valor/data reais.
- Depende de: 7. Habilita: 9 (notificações de check-in/out), 10 (financeiro real).

## Fase 9 — Notificações administrativas
- **9.1 Tabela `notification`** (tipo, título, descrição, lida, referência ao recurso, destinatário).
- **9.2 Centro de notificações**: sino + contador + dropdown + marcar lida + abrir recurso.
- **9.3 Emissão de eventos**: nova reserva, alteração, cancelamento, hold expirando, check-in/out
  próximos, pagamento registrado. Reaproveita hooks já existentes nos serviços.
- **9.4 Tela de auditoria** (leitura de `audit_log`) — P2.
- Depende de: 8.

## Fase 10 — Financeiro & Relatórios (V1, derivado de reservas)
- **10.1 Painel financeiro**: receita prevista (CONFIRMED/estadia), recebida (pagamentos manuais),
  pendente, ticket médio, faturamento por período.
- **10.2 Relatórios** diário/semanal/mensal + **gráficos** (faturamento no tempo, reservas por
  período, pagamentos por status) — dados reais do backend, `dataviz` acessível.
- **10.3 (P2)** Despesas / fluxo de caixa / resultado — só se o negócio pedir.
- Depende de: 8.3 (pagamento manual).

## Fase 11 — Portal do cliente
- **11.1 Autenticação do hóspede** (ver ADR-0002: link mágico por e-mail, sem senha — reaproveita
  `guest`, sem misturar com o Better Auth do admin).
- **11.2 "Minhas reservas"**: próxima hospedagem, histórico, detalhes, status, perfil.
- Reavalia a decisão V1 "hóspede não tem login". Depende de: 8.

## Fase 12 — Disponibilidade visual & conversão pública
- **12.1 Calendário de disponibilidade** em `/reservar` (datas livres/ocupadas, seleção de período,
  dados reais de `occupancy`).
- **12.2 Mini-widget de datas no hero**; **12.3 galeria por categoria**; **12.4 footer accordion**.
- Depende de: 4/5 (disponibilidade), 7 (UX base).

## Fase 13 — Fidelidade, RBAC, mensageria (preparação/V2)
- Estrutura de fidelidade (contagem por hóspede, cupons, benefícios) — **preparar sem regra
  comercial inventada** (ver gap G). RBAC (proprietário × recepção). Mensageria admin↔hóspede.

## Fase 14 — Hardening, Observabilidade & Deploy V1  *(ex-Fases 7/8 do plano)*
- Revisão de segurança, testes E2E completos, rate-limit persistente, Sentry (opcional), retenção
  LGPD, deploy de produção (domínio/env/backups/smoke).

## Fase 15+ (V2) — Pagamentos online (Mercado Pago), upload de fotos, MFA, canais (iCal).

---

## Transição para PMS (auditoria 2026-09-18 — ver `product-audit.md`)

> Fases 7–10 concluídas. Correções recentes (menu mobile via portal, fotos por acomodação,
> reservas confirmadas no calendário/painel) já entregues. Novas fases abaixo.

### Fase 16 — UX/UI PMS (mobile-first)  `[EM ANDAMENTO]`
- **16.1 Dashboard "regra dos 5s"**: cards Check-ins/Check-outs de hoje, Ocupação %, **Receita do mês**;
  bloco "Precisa de atenção" (pendentes, pagamentos não confirmados). *(parcial: receita do mês)*
- **16.2 Configurações em seções/tabs**: Dados da Pousada (CNPJ, endereço, contatos, redes) ·
  Operação (check-in/out, regras pets/festas, mínimo de estadia) · Financeiro & Reservas (expiração
  de hold, prazos, taxas) · Integrações (URLs iCal — UI agora, sync na Fase B).
- Depende de: 10.

### Fase 17 — Hóspedes como CRM leve
- Documento (CPF/Passaporte), aniversário, **histórico de estadias**, **ticket médio gasto**,
  status **VIP/Blacklist**, observações. Perfil do hóspede (`/admin/hospedes/{id}`).
- Depende de: 8 (pagamentos), reservas.

### Fase 18 — Upload binário de fotos (Supabase Storage)
- Troca a origem da `accommodation_photo.url` para upload (bucket + validação magic-bytes + signed
  URL). Precisa de env de storage (SUPABASE_URL + SERVICE_ROLE_KEY).

### Fase 19 — Fidelidade, RBAC, Mensageria (ex-Fase 13)
- Fidelidade (contagem de estadias por hóspede, benefícios — sem regra comercial inventada) ·
  RBAC (proprietário × recepção, menor privilégio, usando `user.role`) · mensageria admin↔hóspede.

### Fase A/B — Availability Engine (canais iCal)
- **Fase A (design — feito):** ver `product-audit.md §3`.
- **Fase B (impl., V2):** `external_busy` + `ical_source`, import (`node-ical`) sob demanda,
  export `/api/ical/export/{token}.ics`, revalidação cruzada anti-overbooking, alerta de conflito.

### Últimas (antes/na produção)
- **Fase 14 — Hardening & Deploy V1** (segurança, E2E completa, rate-limit persistente, retenção
  LGPD, domínio/env/backups). **Fase 15+ (V2)** — pagamentos online (Mercado Pago), MFA, canais iCal.

---
### Dependências (resumo)
`7 → 8 → {9, 10} → {16, 17}`, `17 → 19`, `8 → 11`, `{4,5,7} → 12`, Availability Engine B = V2,
hardening/deploy (14) antes de produção real, pagamentos online (15) dependem de 8.3 + 10.

---
---

## Fases de segurança & operação em produção (20–22)

> Adicionadas após o bloco de correções + QA de Set/2026. Pré-requisito recomendado: Fase 14
> concluída (rate-limit persistente, CSP, audit append-only, retenção LGPD já entregues).

### Fase 20 — Pentest & Bug Bounty
Teste de penetração formal **antes de abrir para volume real de reservas**.
- **Escopo (OWASP Top 10):** Injection, Broken Authentication, XSS, CSRF, IDOR/BOLA, Security
  Misconfiguration, Sensitive Data Exposure, XXE, Insecure Deserialization, Insufficient Logging.
- **Casos específicos do sistema:**
  - Força bruta em `/admin/login` (rate limit persistente já existe — **validar eficácia**).
  - Manipulação de `public_code` e `idempotency_key`.
  - IDOR em `/api/admin/*` (trocar IDs de reservas de terceiros).
  - Upload malicioso (polyglot, path traversal no bucket, magic-bytes bypass).
  - Headers de segurança via securityheaders.com.
  - Dependências via `npm audit` + Snyk.
- **Entregável:** relatório CVSS com criticidade por finding.
- **Ferramentas:** OWASP ZAP (scan automatizado), Burp Suite Community (manual), nuclei.
- **Responsável:** profissional externo OU serviço gerenciado (HackerOne, Cobalt).

### Fase 21 — Observabilidade: Sentry + Uptime
- **21.1 Sentry:** `@sentry/nextjs`; DSN via `SENTRY_DSN`; captura server-side (Route Handlers,
  Server Actions, serviços) + client (Error Boundaries); breadcrumbs de ações admin (reserva
  confirmada, pagamento lançado); **ignorar cold-start 57014** para não poluir alertas; alerta por
  e-mail para P0 (exceções não tratadas em prod); source maps no build (sem expor ao browser).
- **21.2 Uptime:** Betteruptime/UptimeRobot (free); monitorar `/api/health` a cada 1min e
  `/api/health?deep=1` a cada 5min (valida DB); alerta (WhatsApp/e-mail) se downtime > 2min.
- **21.3 Vercel Analytics:** Web Vitals; alvos LCP < 2,5s, FID < 100ms, CLS < 0,1.
- **21.4 Logs estruturados:** todos os erros server-side com `console.error` + contexto JSON;
  (V2, opcional) Vercel Log Drains → Axiom/Papertrail.

### Fase 22 — Segurança contínua
- **22.1 Dependabot:** ativar no GitHub (updates de deps com vulnerabilidade).
- **22.2 SBOM:** `npm sbom` no CI.
- **22.3 Secret scanning:** confirmar/expandir cobertura do gitleaks (já no CI).
- **22.4 CSP Report-Only:** migrar a CSP para report-only com relatórios (Sentry/report-uri) para
  capturar violações sem quebrar funcionalidades, antes de endurecer.
- **22.5 2FA admin:** TOTP (plugin do Better Auth ou `speakeasy`), opt-in para contas OWNER.
