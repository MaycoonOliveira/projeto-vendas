# Gap Analysis de Produto — Casa Carram

> Auditoria completa (PM · UX · Arquitetura · QA · BA · Full-Stack) do sistema **após a Fase 6**.
> Cada item foi **verificado no código atual e/ou na aplicação rodando** — não presumido pela
> existência de uma tela. Prioridades: **P0** crítico p/ operação · **P1** importante p/ lançamento ·
> **P2** evolução · **P3** futuro.

## Divergências com a documentação de referência

- O documento `UX-BEFORE-AFTER.md` (fornecido em `~/Desktop/lovable/`, **fora do repositório** — não
  versionado) foi lido e é **majoritariamente factual e atual** (pós-Fase 6). Divergências encontradas:
  - **Typography — Fraunces no admin (🟡 no doc):** *não é um gap*. `src/app/layout.tsx` carrega
    `Fraunces` como `--font-fraunces` no `<html>` raiz; o `/admin` herda o layout raiz. **Fonte OK.**
  - **Navbar mobile (público):** o doc trata como "correto" — confirmado: `navbar.tsx` já tem
    hamburger + drawer com scroll-lock e Escape. O problema de menu mobile é **exclusivo do admin**.
- Regra factual: onde houver divergência, **vale o estado atual do sistema** (registrado aqui).

## Estado herdado (Fases 0–6) — o que já funciona ponta a ponta (verificado)

- Auth admin (Better Auth, sessões em DB, DAL, proxy otimista, CSP prod). ✅
- Acomodações + tarifas (CRUD, EXCLUDE anti-sobreposição). ✅
- Disponibilidade pública (`/api/disponibilidade`, expire-on-read). ✅
- Reservas transacionais anti-overbooking (EXCLUDE + FOR UPDATE + idempotência); provado com 2
  conexões paralelas → 1×201 + 1×409. ✅
- Máquina de estados de reserva (PENDING/CONFIRMED/CANCELLED/EXPIRED/COMPLETED/NO_SHOW) + edição com
  optimistic locking. ✅
- Bloqueios, calendário (página), hóspedes (leitura), configurações. ✅

---

## MATRIZ DE GAPS

### A. Administração — operação diária

| Área | Requisito | Existe? | Estado atual | Gap | Prio | Fase |
|---|---|---|---|---|---|---|
| Navegação | Menu mobile no admin | ❌ | `admin-shell` usa `hidden lg:flex`; **sem** hamburger/drawer < 1024px | Proprietária não navega no celular | **P0** | 7 |
| Dashboard | Centro de operação (chegadas/saídas hoje, ocupação, atenção) | ⚠️ Parcial | Só cards de contagem + "próximas chegadas" | Sem saídas/hoje, ocupação, in-house, atenção, mini-calendário | **P0** | 7 |
| Dashboard | Calendário resumido no dashboard | ❌ | Calendário só em `/admin/calendario` | Precisa de faixa/mini-calendário no dashboard | **P0** | 7 |
| Reservas | Busca por hóspede/código | ❌ | Filtro só por status | Achar reserva exige rolar a lista | P1 | 7 |
| Reservas | Paginação | ❌ | `limit(200)` sem paginação | Escala ruim com volume | P1 | 7 |
| Feedback | Toast de sucesso/erro nas ações | ❌ | `?saved=1` + reload | UX entrecortada | P1 | 7 |
| Estados de UI | Loading/skeleton, empty, error | ⚠️ Parcial | Empty states simples; sem skeleton; erro genérico | Tela branca em conexão lenta | P1 | 7 |
| A11y | `aria-live` em conteúdo dinâmico | ❌ | Sem anúncios p/ leitor de tela | Acessibilidade | P1 | 7 |
| Reservas | Registrar observação operacional / nota interna | ⚠️ Parcial | `guest.notes` só na criação | Sem nota interna por reserva editável | P1 | 8 |
| Operação | Check-in / check-out (marcar entrada/saída) | ❌ | Estados param em COMPLETED; sem CHECKED_IN | Sem controle de hospedagem | **P0** | 8 |
| Operação | Hóspedes previstos/presentes, atrasos, no-show | ⚠️ Parcial | NO_SHOW existe; sem "presentes"/atraso | Operação de recepção incompleta | P1 | 8 |
| Permissões | Papéis (proprietário × recepção), gestão de admins | ❌ | 1 papel `ADMIN` (coluna `role` preparada) | RBAC | P2 | 13 |
| Auditoria | Tela de auditoria/log | ⚠️ Parcial | `audit_log` gravado; sem tela | Rastreabilidade visível | P2 | 9 |

### B. Notificações

| Área | Requisito | Existe? | Estado atual | Gap | Prio | Fase |
|---|---|---|---|---|---|---|
| Admin | Centro de notificações (sino, contador, dropdown, lida/não lida) | ❌ | Não existe | Eventos operacionais passam despercebidos | **P0** | 9 |
| Admin | Eventos: nova reserva, alteração, cancelamento, hold expirando, check-in/out próximos | ❌ | Só e-mail ao criar reserva | Sem feed in-app | P1 | 9 |
| Infra | Tabela `notification` + referência ao recurso | ❌ | — | Persistência de notificações | P1 | 9 |

### C. Financeiro & Relatórios

| Área | Requisito | Existe? | Estado atual | Gap | Prio | Fase |
|---|---|---|---|---|---|---|
| Financeiro | Painel: receita realizada/prevista, pendências, ticket médio | ❌ | `total_price_cents` por reserva; sem agregação | Sem visão financeira | **P0** | 10 |
| Financeiro | Registro de pagamento (manual no V1, sem gateway) | ❌ | Sem tabela `payment` (desenhada p/ V2) | Confirmar pagamento não persiste valor/data | P1 | 10 |
| Relatórios | Diário/semanal/mensal + gráficos (faturamento, reservas, status) | ❌ | Não existe | Tomada de decisão | P1 | 10 |
| Financeiro | Despesas / fluxo de caixa / resultado | ❌ | Não modelado | Fora do escopo do domínio atual | P2 | 10 |

### C.1 Divergência de escopo importante (registro factual)

> **Pagamento online é V2** (decisão travada no plano: "V1 não terá pagamento online"; reserva vira
> *hold*, cobrança fora do site). Portanto o **Financeiro do V1** é **derivado das reservas** (receita
> prevista = CONFIRMED/estadias; recebido = pagamentos **manuais** registrados pelo admin). Um módulo
> financeiro completo com gateway/despesas é **P2/V2**. Estados de reserva "pagamento pendente/paga"
> dependem de pagamentos → **não** serão inventados; usaremos um registro de pagamento manual.

### D. Cliente / Portal

| Área | Requisito | Existe? | Estado atual | Gap | Prio | Fase |
|---|---|---|---|---|---|---|
| Portal | Área logada do cliente ("Minhas reservas", histórico, perfil) | ❌ | `/reserva/{code}` (capability, sem login) | Sem portal | P2 | 11 |
| Cliente | Login/cadastro do hóspede | ❌ | **Decisão V1: hóspede não tem login** | Contradiz decisão travada → nova decisão (ADR) | P2 | 11 |
| Cliente | Comunicação/mensagens admin↔hóspede | ❌ | Só WhatsApp/e-mail externos | Mensageria in-app | P3 | 13 |

### E. Reserva pública (site) — UX

| Área | Requisito | Existe? | Estado atual | Gap | Prio | Fase |
|---|---|---|---|---|---|---|
| Reserva | Stepper visual (1 Datas → 2 Disponibilidade → 3 Dados) | ❌ | 3 passos sem indicação | Abandono | P1 | 7 |
| Reserva | Validação inline (checkout>checkin, campos) | ⚠️ Parcial | `required`/`min` HTML; erro só pós-API | Espera até API p/ ver erro | P1 | 7 |
| Reserva | Confirmação com impacto visual (check animado) | ⚠️ Parcial | Página funcional, sem ✓/animação | Polimento | P2 | 7 |
| Disponibilidade | Calendário visual (datas livres/ocupadas, seleção de período) | ❌ | Form de datas manual | Menos intuitivo | P1 | 12 |
| Home | Seção "Como funciona" (fluxo pendente→contato) | ❌ | Não existe | Clareza do processo | P1 | 7 |
| Home | Mini-widget de datas no hero | ❌ | CTA leva a `/reservar` | Fricção | P2 | 12 |
| Galeria | Filtro por categoria | ❌ | Grid único | Navegação de fotos | P3 | 12 |
| FAQ | Animação abrir/fechar | ⚠️ | `<details>` nativo | Polimento | P3 | 7 |

### F. Mobile (auditoria transversal)

| Tela | Estado atual | Gap | Prio | Fase |
|---|---|---|---|---|
| Admin (todas) | Sem menu mobile; tabelas largas com `overflow-x-auto` | Menu drawer + tabelas→cards em telas estreitas | **P0** | 7 |
| Público | Navbar/drawer OK; footer longo | Accordion no footer (P3) | P3 | 12 |
| Formulários admin | Funcionam, mas densos | Touch targets/layout revisados | P1 | 7 |

### G. Fidelidade (preparação arquitetural)

| Requisito | Existe? | Gap | Prio | Fase |
|---|---|---|---|---|
| Estrutura p/ contagem de reservas por hóspede, cupons, benefícios | ❌ | `guest` sem agregados; sem `coupon`/`loyalty` | **PROPOSTA** — preparar sem implementar regra comercial | P3 | 13 |

### H. Segurança / Observabilidade (Fase 7 original, agora sequenciada)

| Requisito | Existe? | Gap | Prio | Fase |
|---|---|---|---|---|
| Testes E2E (Playwright) dos fluxos reais | ❌ | Configurado, sem specs | P1 | 7/8 |
| Rate-limit persistente (hoje em memória) | ⚠️ | Best-effort por instância | P2 | 14 |
| Sentry/observabilidade | ❌ | Logs Vercel | P2 | 14 |
| Revisão de segurança / headers / LGPD retenção | ⚠️ | Parcial | P1 | 14 |

---

## Definição de Pronto (aplicada a cada item)

backend ✓ · frontend ✓ · banco correto ✓ · regra de negócio ✓ · responsivo (mobile validado) ✓ ·
testes passam ✓ · UX revisada ✓ · documentação atualizada ✓. **Uma tela não conclui um requisito.**
