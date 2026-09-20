// Teste de CARGA de leitura (k6) — simula muitos visitantes consultando disponibilidade e
// calendário ao mesmo tempo. Só leitura (não cria reservas), então é seguro repetir.
//
//   k6 run -e BASE_URL=https://<deploy-dev>.vercel.app tests/load/read-load.js
//
// Ajuste o perfil pela variável PROFILE: smoke | load | stress | spike (default: load).
//   k6 run -e BASE_URL=... -e PROFILE=stress tests/load/read-load.js
//
// Rode SEMPRE contra DEV. As APIs têm rate limit de 60 req/min por IP — como o k6 sai de um
// único IP, perfis muito agressivos vão gerar 429 legítimos (a métrica `rate_limited` conta isso).

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const PROFILE = __ENV.PROFILE || "load";

const rateLimited = new Rate("rate_limited"); // fração de respostas 429 (esperado sob carga alta)

// Perfis de carga. `stages` sobe/desce o nº de usuários virtuais (VUs) ao longo do tempo.
const PROFILES = {
  smoke: { stages: [{ duration: "30s", target: 1 }] },
  load: {
    stages: [
      { duration: "30s", target: 10 }, // sobe para 10 usuários
      { duration: "1m", target: 10 }, // sustenta
      { duration: "30s", target: 0 }, // desce
    ],
  },
  stress: {
    stages: [
      { duration: "1m", target: 20 },
      { duration: "1m", target: 40 },
      { duration: "1m", target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: "10s", target: 5 },
      { duration: "10s", target: 50 }, // pico súbito
      { duration: "20s", target: 5 },
      { duration: "10s", target: 0 },
    ],
  },
};

export const options = {
  scenarios: {
    reads: { executor: "ramping-vus", startVUs: 0, ...PROFILES[PROFILE] },
  },
  thresholds: {
    // SLOs de leitura (ignora os 429, que são proteção funcionando):
    "http_req_duration{expected_response:true}": ["p(95)<800", "p(99)<1500"],
    "http_req_failed{scenario:reads}": ["rate<0.05"],
  },
};

function isoInDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function () {
  const from = isoInDays(1);
  const to = isoInDays(31);

  // 70% olham o calendário, 30% consultam disponibilidade com hóspedes.
  let res;
  if (Math.random() < 0.7) {
    res = http.get(`${BASE_URL}/api/calendario?from=${from}&to=${to}`, {
      tags: { name: "calendario" },
    });
  } else {
    const checkin = isoInDays(7);
    const checkout = isoInDays(9);
    res = http.get(
      `${BASE_URL}/api/disponibilidade?checkin=${checkin}&checkout=${checkout}&guests=2`,
      { tags: { name: "disponibilidade" } },
    );
  }

  rateLimited.add(res.status === 429);
  check(res, {
    "200 ou 429 (nunca 5xx)": (r) => r.status === 200 || r.status === 429,
  });

  sleep(Math.random() * 2 + 1); // think time 1–3s (visitante real, não robô)
}
