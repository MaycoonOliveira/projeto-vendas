// Teste de CONCORRÊNCIA anti-overbooking (k6) — o mais importante do sistema.
// Dispara N reservas SIMULTÂNEAS para a MESMA acomodação e o MESMO período. O esperado:
//   • exatamente 1 resposta 201 (a reserva que venceu)
//   • todas as outras 409 (datas indisponíveis) — NUNCA duas 201 (isso seria overbooking).
//
//   k6 run \
//     -e BASE_URL=https://<deploy-dev>.vercel.app \
//     -e ACCOMMODATION_ID=<uuid-de-uma-acomodacao-de-DEV> \
//     tests/load/reservation-race.js
//
// ⚠️ ATENÇÃO
//   • Rode SÓ contra DEV. Cada 201 cria um HOLD real (PENDENTE 24h) — cancele/expire depois.
//   • O rate limit é 10 reservas/hora por IP. Como o k6 sai de 1 IP, mantenha VUS ≤ 8 por rodada;
//     acima disso você verá 429 (proteção funcionando), não 409. Para testar volumes maiores de
//     concorrência real, rode de IPs distintos ou eleve o limite temporariamente em DEV.
//   • Use datas BEM no futuro (ex.: +180 dias) para não colidir com reservas de teste existentes.

import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const ACCOMMODATION_ID = __ENV.ACCOMMODATION_ID; // obrigatório
const VUS = Number(__ENV.VUS || 8);
const DAYS_AHEAD = Number(__ENV.DAYS_AHEAD || 180);

const created = new Counter("reservas_criadas_201");
const conflict = new Counter("reservas_conflito_409");
const limited = new Counter("reservas_rate_limited_429");

export const options = {
  // Todos os VUs disparam ~ao mesmo tempo, 1 iteração cada → uma "corrida" única.
  scenarios: {
    race: {
      executor: "per-vu-iterations",
      vus: VUS,
      iterations: 1,
      maxDuration: "1m",
    },
  },
  thresholds: {
    // A trava do banco pode transformar conflito em 409 OU (sob lock) em erro de constraint tratado.
    reservas_criadas_201: ["count<=1"], // NUNCA mais de uma reserva vence
  },
};

function isoInDays(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function setup() {
  if (!ACCOMMODATION_ID) {
    throw new Error(
      "Defina -e ACCOMMODATION_ID=<uuid de uma acomodação de DEV>. " +
        "Pegue um id em /api/disponibilidade (campo results[].id).",
    );
  }
  // Mesmo período para TODOS os VUs — é isso que força a corrida.
  return { checkin: isoInDays(DAYS_AHEAD), checkout: isoInDays(DAYS_AHEAD + 2) };
}

export default function (data) {
  const payload = JSON.stringify({
    accommodationId: ACCOMMODATION_ID,
    checkin: data.checkin,
    checkout: data.checkout,
    guestsCount: 2,
    guest: {
      fullName: `Teste Carga VU${__VU}`,
      email: `carga+vu${__VU}@exemplo-dev.invalid`,
      phone: "+55 24 90000-0000",
      notes: "reserva de teste de carga — pode cancelar",
    },
  });

  const res = http.post(`${BASE_URL}/api/reservas`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "reservas_post" },
  });

  if (res.status === 201) created.add(1);
  else if (res.status === 409) conflict.add(1);
  else if (res.status === 429) limited.add(1);

  check(res, {
    "sem 5xx": (r) => r.status < 500,
    "resultado esperado (201/409/422/429)": (r) =>
      [201, 409, 422, 429].includes(r.status),
  });
}

// Ao final, o k6 imprime os contadores. Leitura correta:
//   reservas_criadas_201 = 1   → ✅ anti-overbooking OK
//   reservas_conflito_409 = VUS-1 (menos os 429)
//   reservas_criadas_201 > 1   → ❌ OVERBOOKING (falha crítica — investigar a exclusion constraint)
