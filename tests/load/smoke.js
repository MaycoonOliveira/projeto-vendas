// Smoke test (k6) — 1 usuário virtual, poucas iterações. Confirma que os endpoints básicos
// respondem antes de rodar carga de verdade. NÃO cria reservas (só leitura).
//
//   k6 run -e BASE_URL=https://<deploy-dev>.vercel.app tests/load/smoke.js
//
// Rode SEMPRE contra o ambiente de DEV. Aqueça o banco antes (o 1º deep-health pode pegar
// cold-start e demorar ~90s — isso é esperado no plano free).

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export const options = {
  vus: 1,
  iterations: 3,
  thresholds: {
    // Smoke é sobre "funciona?", não performance — limites frouxos.
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

// Datas ISO (YYYY-MM-DD) a partir de hoje + offset em dias.
function isoInDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function () {
  // 1) Health raso (não toca o banco) — deve ser instantâneo.
  const shallow = http.get(`${BASE_URL}/api/health`);
  check(shallow, { "health raso 200": (r) => r.status === 200 });

  // 2) Health profundo (SELECT 1) — confirma a conexão com o banco.
  const deep = http.get(`${BASE_URL}/api/health?deep=1`, { timeout: "120s" });
  check(deep, { "health deep 200": (r) => r.status === 200 });

  // 3) Calendário dos próximos 30 dias (leitura pública).
  const cal = http.get(
    `${BASE_URL}/api/calendario?from=${isoInDays(1)}&to=${isoInDays(31)}`,
  );
  check(cal, {
    "calendario 200": (r) => r.status === 200,
    "calendario tem dias": (r) => {
      try {
        return Array.isArray(r.json("days"));
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
