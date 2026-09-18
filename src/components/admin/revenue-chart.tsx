import type { MonthlyPoint } from "@/lib/services/finance";
import { formatCentsBRL } from "@/lib/utils";

/**
 * Gráfico de barras agrupadas: faturamento previsto × recebido por mês (Fase 10).
 * Paleta validada (dataviz): verde #2f8f64 (previsto) + âmbar #cf9440 (recebido) — passa
 * banda de luminosidade, chroma, separação CVD (ΔE 9.0) e contraste. Componente de servidor
 * (SVG estático) com tooltip nativo (`<title>`) e tabela equivalente para leitores de tela.
 */
const REVENUE = "#2f8f64";
const RECEIVED = "#cf9440";

const MONTH_ABBR = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function monthLabel(ym: string): string {
  const m = Number(ym.slice(5, 7));
  return MONTH_ABBR[m - 1] ?? ym;
}

export function RevenueChart({ data }: { data: MonthlyPoint[] }) {
  const W = 720;
  const H = 260;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 26;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const maxCents = Math.max(
    1,
    ...data.map((d) => Math.max(d.revenueCents, d.receivedCents)),
  );
  // Escala "bonita": arredonda o topo para cima.
  const niceMax = niceCeil(maxCents);

  const groupW = plotW / data.length;
  const barW = Math.min(16, groupW * 0.32);
  const gap = 2;
  const y = (cents: number) => padT + plotH - (cents / niceMax) * plotH;

  const gridLines = 4;

  const hasData = data.some((d) => d.revenueCents > 0 || d.receivedCents > 0);

  return (
    <figure className="m-0">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-foreground/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: REVENUE }} />
          Faturamento previsto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm" style={{ backgroundColor: RECEIVED }} />
          Recebido
        </span>
      </div>

      {hasData ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Faturamento previsto e recebido por mês, últimos ${data.length} meses.`}
        >
          {/* Gridlines horizontais (recessivas) + rótulos de valor */}
          {Array.from({ length: gridLines + 1 }, (_, i) => {
            const val = (niceMax / gridLines) * i;
            const gy = padT + plotH - (i / gridLines) * plotH;
            return (
              <g key={i}>
                <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="currentColor" className="text-border" strokeWidth={1} />
                <text x={padL} y={gy - 3} className="fill-foreground/40" fontSize={9}>
                  {val >= 100000 ? `${Math.round(val / 100000)}k` : formatCentsBRL(val).replace(/\s/g, "")}
                </text>
              </g>
            );
          })}

          {/* Barras agrupadas */}
          {data.map((d, i) => {
            const gx = padL + i * groupW + groupW / 2;
            const x1 = gx - barW - gap / 2;
            const x2 = gx + gap / 2;
            return (
              <g key={d.month}>
                <rect x={x1} y={y(d.revenueCents)} width={barW} height={Math.max(0, padT + plotH - y(d.revenueCents))} rx={3} fill={REVENUE}>
                  <title>{`${monthLabel(d.month)}: previsto ${formatCentsBRL(d.revenueCents)}`}</title>
                </rect>
                <rect x={x2} y={y(d.receivedCents)} width={barW} height={Math.max(0, padT + plotH - y(d.receivedCents))} rx={3} fill={RECEIVED}>
                  <title>{`${monthLabel(d.month)}: recebido ${formatCentsBRL(d.receivedCents)}`}</title>
                </rect>
                <text x={gx} y={H - 8} textAnchor="middle" className="fill-foreground/50" fontSize={10}>
                  {monthLabel(d.month)}
                </text>
              </g>
            );
          })}
        </svg>
      ) : (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-8 text-center text-sm text-foreground/50">
          Sem faturamento no período ainda.
        </p>
      )}

      {/* Tabela equivalente para leitores de tela */}
      <table className="sr-only">
        <caption>Faturamento previsto e recebido por mês</caption>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Previsto</th>
            <th>Recebido</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{formatCentsBRL(d.revenueCents)}</td>
              <td>{formatCentsBRL(d.receivedCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Arredonda o topo do eixo para um valor "redondo" (1/2/5 × 10^n). */
function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const exp = Math.floor(Math.log10(n));
  const base = Math.pow(10, exp);
  const frac = n / base;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return nice * base;
}
