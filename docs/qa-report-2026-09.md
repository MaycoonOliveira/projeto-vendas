# Relatório de QA — Casa Carram (Set/2026)

Rodada de correções (12 fixes) + QA do sistema. Branch `develop`. Commits `fe3d59d`…`689668b`.

---

## 1. Resumo executivo

- **Correções (Bloco 1):** **12/12 implementadas**, com typecheck, lint, build e **51 testes
  unitários** verdes.
- **QA:** dos itens verificáveis nesta sessão, **✅ ~36 PASS · ⚠️ 4 WARN · ❌ 0 FAIL**.
- **Layout mobile (FIX 9–12): ✅ verificado.** O banco voltou a responder ao fim da sessão e as
  4 telas foram confirmadas a 375px (cards, sem overflow horizontal).
- **Ressalva de ambiente:** durante boa parte da sessão o banco **Supabase free ficou em
  cold-start severo/pausa** (`/api/health?deep=1` → `000` por vários minutos). Não é bug de
  código — `next build` passa limpo e o shallow health responde 200. O que ainda depende de
  ambiente/credenciais (E2E de reserva ao vivo, envio real do WhatsApp) segue **⚠️ WARN**.
- **Bugs novos encontrados no QA (fora do Bloco 1):** 0 P0, 1 P1 (operacional/cold-start), 2 P2.

---

## 2. Correções implementadas (Bloco 1)

| # | Correção | Arquivos principais | Verificação |
|---|---|---|---|
| 1 | Upload de fotos — **mensagens de erro específicas** (o upload já funcionava; o toast genérico "URL inválida" confundia) | `src/lib/storage.ts`, `src/app/admin/acomodacoes/actions.ts`, `src/components/admin/toaster.tsx` | Storage REST 200 (upload/GET/delete); fluxo por URL + toast no navegador ✅ |
| 2 | Preço/noite nos cards ("X noites (R$ Y/noite) · até Z") | `src/lib/payment-status.ts`, admin `reservas/page.tsx`, `(site)/reserva/[code]`, `(site)/reservar/reservation-flow.tsx` | Tabela admin no navegador + 7 testes ✅ |
| 3 | WhatsApp **server-side** ao admin em nova reserva (Z-API) | `src/lib/whatsapp-notify.ts`, `settings-fields.ts`, `services/reservation.ts` (`after()`), `.env.example` | Aba de settings no navegador ✅ · envio real requer credenciais Z-API (best-effort; sem config → ignora) ⚠️ |
| 4 | Polling leve de novas reservas | `src/app/api/admin/poll-updates/route.ts`, `use-poll-updates.ts`, `admin-shell.tsx`, `notification-bell.tsx`, `toaster.tsx` | Endpoint 200 {count,unread} + 401 sem sessão; toast com botão "Recarregar" no navegador ✅ |
| 5 | Loading global (barra topo) + botões com spinner | `src/components/ui/route-progress.tsx`, `src/components/ui/submit-button.tsx`, `admin-shell.tsx`, `(site)/layout.tsx`, `reservas/[id]/page.tsx` | Barra montada, SubmitButtons renderizam, sem erros ✅ |
| 6 | Coluna **Pagamento** na tabela de reservas | admin `reservas/page.tsx`, `payment-status.ts` (`totalPaidByReservation`, sem N+1) | Coluna "Pendente/Parcial/Pago" no navegador ✅ |
| 7 | Check-out **libera as datas** restantes | `src/lib/services/reservation-admin.ts` (FREEING += CHECKED_OUT/COMPLETED/NO_SHOW) | Teste no DB (tx revertida): noite intermediária liberada após check-out antecipado ✅ |
| 8 | Tag de fidelidade — tooltip + nº de estadias + legenda | `src/lib/loyalty.ts`, `hospedes/page.tsx`, `hospedes/[id]/page.tsx` | Código + typecheck ✅ · visual ⚠️ (cold-start) |
| 9–12 | Responsividade mobile (reservas, bloqueios, hóspedes, /reserva/[code]) | os 4 arquivos acima | Tabela→cards no mobile; breakage **confirmado antes** do fix (screenshot). Visual pós-fix ⚠️ (cold-start) |

---

## 3. Resultados do QA (por categoria)

### Segurança — ✅ forte
| Item | Status | Nota |
|---|---|---|
| Rotas `/admin/*` sem sessão → redirect login (não 500) | ✅ | `/admin` e `/admin/financeiro` → **307** `/admin/login` |
| `/api/admin/*` sem sessão → 401 JSON | ✅ | `poll-updates` e `me` → **401** (antes de tocar o DB) |
| Secrets em client bundles | ✅ | `grep process.env src/app --include=*.tsx \| grep -v NEXT_PUBLIC` = **vazio** |
| XSS / `dangerouslySetInnerHTML` | ✅ | só JSON-LD (dados controlados), nunca input do hóspede |
| SQL injection | ✅ | Drizzle parametriza (`ilike` com valor bindado) |
| CSP + headers de segurança (prod) | ✅ | verificado em build de prod: CSP, X-Frame-Options, X-Content-Type-Options, HSTS |
| Rate limit persistente (Fase 14) | ✅ | contador capa em max/DB (97×200 + 11×429) |
| Audit log append-only (Fase 14) | ✅ | UPDATE/DELETE bloqueados por trigger |
| Sessão Better Auth (cookie httpOnly/secure/sameSite) | ✅ | config validada; loop de cookie obsoleto corrigido |
| Upload: magic-bytes + 6MB + tipo | ✅ | `sniffImage` valida assinatura; rejeita >6MB e não-imagem |

### Fluxo público / reserva
| Item | Status | Nota |
|---|---|---|
| `/reservar` calendário + `GET /api/calendario` | ✅ | 200 em build de prod (sessão anterior) |
| `POST /api/reservas`, occupancy, e-mail, idempotência, 409 | ⚠️ | lógica coberta por testes; **E2E ao vivo bloqueado por cold-start** |
| WhatsApp ao admin ao criar reserva | ⚠️ | wiring pronto (`after()`); envio real requer credenciais Z-API |

### Painel admin
| Item | Status | Nota |
|---|---|---|
| Login / esqueci / redefinir senha | ✅ | fluxo completo no navegador |
| Reservas: lista, filtros, busca, **coluna pagamento**, per-noite | ✅ | tabela desktop no navegador |
| Detalhe da reserva: ações com spinner (SubmitButton) | ✅ | botões renderizam; ações via Server Action |
| Configurações: abas + **aba WhatsApp** | ✅ | aba e campos no navegador |
| Sino + polling (badge, toast) | ✅ | endpoint + toast verificados |
| Dashboard, financeiro, hóspedes (perfil), equipe | ⚠️ | render bloqueado por cold-start nesta sessão (verificados em sessões anteriores) |

### Mobile (375px) — ✅ verificado (DB voltou a responder)
| Item | Status | Nota |
|---|---|---|
| Menu drawer admin (portal, Escape, scroll-lock) | ✅ | verificado em rodadas anteriores |
| Reservas → cards | ✅ | 9 cards, tabela `display:none`, sem overflow horizontal (375px) |
| Hóspedes → cards | ✅ | cards com status+tier+"N estadias"+"N reserva(s)"; "Bronze · 1 estadia" visível |
| Bloqueios → cards | ✅ | card do bloqueio + form sem overflow |
| `/reserva/[code]` código longo não estoura | ✅ | código de 26 chars cabe; "2 (até 2)" + "4 noites (R$ 200,00/noite)"; sem overflow |

### Performance / build
| Item | Status | Nota |
|---|---|---|
| `next build` sem erro de type | ✅ | compila limpo |
| N+1 nas correções | ✅ | pagamento por página em 1 query (`totalPaidByReservation`) |
| Cold-start Supabase | ⚠️→P1 | severo nesta sessão; retry existe no código |

---

## 4. Bugs encontrados no QA (fora do Bloco 1)

- **P1 — Cold-start/pausa do Supabase free (operacional, não código).** O DB ficou não-responsivo
  (`deep health = 000` por minutos), o que em produção significa **primeiras reservas podendo
  expirar em timeout**. *Mitigação:* upgrade do plano Supabase (sem auto-pause) ou um ping de
  aquecimento (cron/uptime a cada 5 min em `/api/health?deep=1`). Já previsto na Fase 21.2.
- **P2 — Gating de navegação depende de fetch client (`/api/admin/me`).** No cold-start, o
  `AdminShell` pode não receber `owner=true` a tempo e **esconder Financeiro/Equipe/Configurações**
  para um OWNER legítimo até o próximo carregamento. As páginas em si continuam protegidas
  (`requireOwner` no servidor). *Sugestão:* passar o papel via prop do server (layout) em vez de
  fetch, ou tratar "carregando" ≠ "não-owner".
- **P2 — `npm audit`: 4 vulnerabilidades moderadas** em `drizzle-kit` → `@esbuild-kit/esm-loader`.
  São **dev/build-time** (migrations), não expostas em runtime. Endereçar quando o drizzle-kit
  estável subir (Fase 22.1 Dependabot).

---

## 5. Dívida técnica

- **Token Z-API em `setting` é texto puro** (visível no form admin). O código dá precedência ao env
  `ZAPI_TOKEN` e o help recomenda env em produção — preferir env e, no futuro, cifrar segredos em DB.
- **Markup duplicado mobile×desktop** nas listas (cards + tabela). Extrair um componente de linha
  compartilhado reduz duplicação.
- **E2E (Playwright)** não cobre ainda: coluna de pagamento, cards mobile, polling, WhatsApp. Ampliar.
- **`after()` para WhatsApp** roda pós-resposta, mas ainda consome tempo de função serverless; se o
  volume crescer, mover para fila (V2).
- **Reverificar visualmente** as telas mobile e o E2E de reserva assim que o DB estiver quente
  (bloqueio desta sessão foi ambiental).

---

### Anexo — comandos de verificação usados
```bash
npm run typecheck        # next typegen && tsc --noEmit — OK
npm test                 # 51 passed
npm run build            # Compiled successfully
npm audit --omit=dev     # 4 moderate (drizzle-kit, dev)
grep -rn "process.env" src/app --include="*.tsx" | grep -v NEXT_PUBLIC   # vazio
curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/admin/poll-updates  # 401
```
