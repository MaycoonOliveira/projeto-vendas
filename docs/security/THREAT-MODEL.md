# THREAT MODEL — Sistema de Reservas (Casa Carram)

> Para cada ameaça: **risco · como acontece · como prevenir · como detectar · como testar.**
> Complementa `SECURITY-ARCHITECTURE.md`. Itens (V2) são desenhados agora, implementados depois.

## Superfícies de ataque

- **Público (sem sessão):** `GET /api/disponibilidade`, `POST /api/reservas`, `GET /api/reservas/{code}`,
  páginas do site, (V2) `POST /api/webhooks/pagamento`.
- **Admin (com sessão):** `/admin/**`, Server Actions do painel.
- **Infra:** banco (Supabase), e-mail (Resend), (V2) gateway/storage.

## Matriz de ameaças

| # | Ameaça | Como acontece | Prevenir | Detectar | Testar |
|---|---|---|---|---|---|
| 1 | Brute force / credential stuffing | tentativas em massa no login | rate limit (Better Auth, IP+conta) + lockout opcional + hash forte + senhas fortes | picos em `audit_log`/alerta | teste de lockout/limite |
| 2 | Bots / scraping | automação em disponibilidade/reserva | rate limit + honeypot + (se preciso) captcha | taxa anômala por IP | teste de rate limit |
| 3 | SQL injection | input malicioso em query | Drizzle (queries parametrizadas) + Zod | erros de query logados | payloads de fuzz |
| 4 | XSS | conteúdo malicioso renderizado | React escaping + **CSP nonce** + sanitizar rich text | CSP report | payload `<script>` em campos |
| 5 | CSRF | POST forjado de outra origem | SameSite + Origin/Referer + Server Actions | origem inválida logada | request cross-origin |
| 6 | IDOR/BOLA | adivinhar reserva/id | `public_code` ~128 bits + DTOs + sessão no admin | 404/403 anômalos | acesso a código inexistente/alheio |
| 7 | Enumeração de reservas | iterar códigos | código longo aleatório + rate limit + sem listagem pública | picos de 404 | script de enumeração |
| 8 | Manipulação de preço | cliente envia total menor | **preço recalculado no servidor** (ignora cliente) | divergência logada | POST com preço falso |
| 9 | Manipulação de datas | passado/invertidas/absurdas | Zod + regras de domínio + limites (máx. noites/data futura) | 400 logado | datas inválidas |
| 10 | **Reserva duplicada** | corrida entre 2 usuários | **exclusion constraint** + transação `FOR UPDATE` + idempotência | taxa de 409 monitorada | **2 POST simultâneos** (1×201/1×409) |
| 11 | **Abuso de inventário** (holds) | criar muitos `PENDING` prendendo datas | hold TTL 24h + rate limit + **teto de PENDING por IP/e-mail** | contagem de PENDING por IP | criar N holds e verificar teto |
| 12 | Sessão inválida/adulterada/revogada | cookie forjado/roubado/revogado | Better Auth (sessão em DB) + httpOnly/Secure + revogação | tentativas logadas | acessar `/admin` com cookie inválido/revogado |
| 13 | Acesso admin indevido | rota/ação sem checagem | deny-by-default + `proxy.ts` (otimista) + **DAL/`verifySession`** | tentativas logadas | acesso sem sessão / role errada |
| 14 | Vazamento de dados | erro expõe stack/PII | erros genéricos + logs sem PII + **DTOs** + minimização | revisão de logs | inspeção de respostas de erro |
| 15 | Abuso de API | flood | rate limit + limites de payload | métricas | carga |
| 16 | Exposição de secrets | segredo no código/repo | env/secret store + **gitleaks no CI** + nunca logar segredos | scanner do CI | grep/secret scan |
| 17 | Fraude/replay de pagamento **(V2)** | reenvio de webhook / evento falso | **assinatura** + `provider_event_id` único + **consulta ao provedor** + conferir valor | eventos rejeitados logados | webhook duplicado/inválido |
| 18 | Webhook falso **(V2)** | POST forjado no endpoint | validar assinatura; nunca confiar no corpo sem verificar | rejeições logadas | assinatura inválida |
| 19 | Upload malicioso **(V2)** | arquivo perigoso | validar content-type + **magic bytes** + tamanho; bucket isolado sem execução; nome aleatório | logs de upload | upload de tipo/tamanho inválido |
| 20 | Exposição de PII do hóspede | `public_code` mostrando dados demais | consulta pública devolve só dados mínimos; documento/CPF só no admin | revisão do payload público | consultar reserva por código e conferir campos |

## Notas de detecção/alertas

- **Alertas**: pico de erros, pico de 401/403, pico de 404 (enumeração), **taxa de 409** (indicador de
  concorrência/abuso), falhas de e-mail, (V2) webhooks rejeitados.
- **Auditoria** (`audit_log`, append-only) é a principal fonte forense; **sem PII sensível** nos logs.

## Casos de teste críticos (resumo — ver `../testing/TEST-STRATEGY.md`)

Duas reservas simultâneas · reserva sobreposta/adjacente · bloqueio×reserva · edição com conflito ·
expiração de hold · manipulação de preço · IDOR · sessão revogada · brute force · idempotência ·
validação de datas · abuso de inventário · (V2) webhook duplicado/inválido.
