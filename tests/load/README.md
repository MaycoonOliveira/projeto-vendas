# Testes de carga (k6 + Grafana)

Ferramenta: **[k6](https://k6.io)** (da Grafana). Scripts em JavaScript, roda local ou na nuvem.

> **Regra de ouro:** rode **sempre contra o ambiente de DEV** (`BASE_URL` do deploy de develop),
> **nunca** contra produção. Não delete a reserva de teste real. Aqueça o banco antes (o 1º
> `deep=1` pode pegar cold-start e demorar ~90s no plano free — é esperado).

## Scripts

| Arquivo | O que faz | Cria reserva? |
|---|---|---|
| `smoke.js` | 1 usuário, confere se health + calendário respondem | Não |
| `read-load.js` | Carga de leitura (calendário/disponibilidade), perfis smoke/load/stress/spike | Não |
| `reservation-race.js` | **Concorrência anti-overbooking**: N reservas simultâneas → 1×201 + resto 409 | Sim (holds em DEV) |

## 1. Instalar o k6

```bash
# Windows (winget) — ou choco install k6
winget install k6 --source winget
# macOS
brew install k6
# Linux: veja https://grafana.com/docs/k6/latest/set-up/install-k6/
```

## 2. Rodar local (saída no terminal)

```bash
# Smoke
k6 run -e BASE_URL=https://<deploy-dev>.vercel.app tests/load/smoke.js

# Carga de leitura (perfil load; troque por stress/spike)
k6 run -e BASE_URL=https://<deploy-dev>.vercel.app -e PROFILE=load tests/load/read-load.js

# Corrida anti-overbooking (pegue um ACCOMMODATION_ID em /api/disponibilidade)
k6 run \
  -e BASE_URL=https://<deploy-dev>.vercel.app \
  -e ACCOMMODATION_ID=<uuid-de-DEV> \
  -e VUS=8 \
  tests/load/reservation-race.js
```

Ao final, procure no resumo: `http_req_duration p(95)`, `http_req_failed`, e — na corrida —
`reservas_criadas_201` (**tem que ser 1**).

## 3. Ver em dashboards do Grafana

Há dois caminhos. O **A (Grafana Cloud k6)** é o mais rápido para ter gráficos bonitos sem
infraestrutura; o **B (Grafana local)** é gratuito e roda na sua máquina.

### Caminho A — Grafana Cloud k6 (recomendado para começar)

1. Crie uma conta grátis em **grafana.com** → no menu, **Testing & synthetics → k6**.
2. Em **Settings → Personal API token**, copie o token.
3. Autentique o CLI e rode na nuvem:
   ```bash
   k6 cloud login --token <SEU_TOKEN>
   k6 cloud run -e BASE_URL=https://<deploy-dev>.vercel.app tests/load/read-load.js
   ```
4. O k6 abre um **link do teste** no navegador com dashboards prontos (percentis, RPS, erros,
   duração por endpoint via as `tags: { name }` dos scripts). Histórico de execuções fica salvo.

> Alternativa sem mudar o comando: `k6 run --out cloud ...` envia as métricas de uma execução
> **local** para o Grafana Cloud (o teste roda na sua máquina, os gráficos ficam na nuvem).

### Caminho B — Grafana local (Docker) com Prometheus

Sobe Prometheus (armazena métricas) + Grafana (dashboards) e manda o k6 escrever nelas.

1. Suba a stack (crie `tests/load/grafana/docker-compose.yml` com Prometheus + Grafana, ou use o
   stack oficial de exemplo do k6: https://github.com/grafana/k6-web-dashboard). Prometheus precisa
   aceitar **remote-write** (flag `--web.enable-remote-write-receiver`).
2. Rode o k6 exportando via Prometheus remote-write:
   ```bash
   K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
   k6 run --out experimental-prometheus-rw \
     -e BASE_URL=https://<deploy-dev>.vercel.app tests/load/read-load.js
   ```
3. No Grafana (http://localhost:3001), adicione o **datasource Prometheus** e **importe o dashboard
   oficial do k6**: Dashboards → Import → ID **19665** ("k6 Prometheus") — ou **2587** para o layout
   clássico via InfluxDB, se preferir esse backend.

> **Modo mais simples ainda (sem Grafana):** o k6 tem um dashboard web embutido em uma execução:
> ```bash
> K6_WEB_DASHBOARD=true k6 run tests/load/read-load.js
> ```
> Abre um painel em `http://127.0.0.1:5665` durante o teste; `K6_WEB_DASHBOARD_EXPORT=report.html`
> salva um relatório estático ao final.

## 4. SLOs sugeridos (metas)

| Métrica | Meta |
|---|---|
| `http_req_duration` p95 (leituras) | < 800 ms |
| `http_req_duration` p99 | < 1500 ms |
| `http_req_failed` (fora 429) | < 5% |
| `reservas_criadas_201` (corrida) | **exatamente 1** (0 overbooking) |

## 5. Limpeza pós-teste

- `reservation-race.js` deixa **1 hold PENDENTE por rodada** em DEV. Cancele no painel
  (`/admin/reservas`) ou deixe expirar (24h). Nunca toque na reserva de teste real de produção.
