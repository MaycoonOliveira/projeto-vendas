import { sql } from "drizzle-orm";

import { db } from "@/db";
import { payment, reservation } from "@/db/schema";
import { todayInSaoPaulo } from "@/lib/dates";

/**
 * Serviço financeiro (Fase 10) — derivado das reservas e dos pagamentos manuais (Fase 8.3).
 * Sem gateway; tudo calculado no servidor a partir de dados reais.
 *
 * "Receita confirmada" = reservas em estados de receita (CONFIRMED/CHECKED_IN/CHECKED_OUT/COMPLETED).
 * PENDING conta como "a confirmar"; CANCELLED/EXPIRED/NO_SHOW não contam.
 */
const REVENUE_STATUSES = sql`('CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED')`;

export type FinanceKpis = {
  confirmedRevenueCents: number;
  confirmedCount: number;
  receivedCents: number;
  outstandingCents: number;
  pendingRevenueCents: number;
  pendingCount: number;
  avgTicketCents: number;
};

export async function financeKpis(): Promise<FinanceKpis> {
  const rows = await db.execute<{
    confirmed_revenue: string;
    confirmed_count: number;
    received: string;
    outstanding: string;
    pending_revenue: string;
    pending_count: number;
  }>(sql`
    WITH rev AS (
      SELECT r.id, r.total_price_cents,
             coalesce((SELECT sum(p.amount_cents) FROM ${payment} p WHERE p.reservation_id = r.id), 0) AS paid
      FROM ${reservation} r
      WHERE r.status IN ${REVENUE_STATUSES}
    )
    SELECT
      coalesce(sum(total_price_cents), 0)::bigint AS confirmed_revenue,
      count(*)::int AS confirmed_count,
      coalesce((SELECT sum(amount_cents) FROM ${payment}), 0)::bigint AS received,
      coalesce(sum(GREATEST(total_price_cents - paid, 0)), 0)::bigint AS outstanding,
      coalesce((SELECT sum(total_price_cents) FROM ${reservation}
                 WHERE status = 'PENDING'
                   AND (hold_expires_at IS NULL OR hold_expires_at >= now())), 0)::bigint AS pending_revenue,
      (SELECT count(*)::int FROM ${reservation}
        WHERE status = 'PENDING'
          AND (hold_expires_at IS NULL OR hold_expires_at >= now())) AS pending_count
    FROM rev`);

  const r = rows[0];
  const confirmedRevenueCents = Number(r?.confirmed_revenue ?? 0);
  const confirmedCount = Number(r?.confirmed_count ?? 0);
  return {
    confirmedRevenueCents,
    confirmedCount,
    receivedCents: Number(r?.received ?? 0),
    outstandingCents: Number(r?.outstanding ?? 0),
    pendingRevenueCents: Number(r?.pending_revenue ?? 0),
    pendingCount: Number(r?.pending_count ?? 0),
    avgTicketCents: confirmedCount > 0 ? Math.round(confirmedRevenueCents / confirmedCount) : 0,
  };
}

export type MonthlyPoint = {
  month: string; // "YYYY-MM"
  revenueCents: number;
  receivedCents: number;
};

/** Faturamento (por mês de check-in) e recebido (por mês de pagamento) nos últimos `months` meses. */
export async function revenueByMonth(months = 12): Promise<MonthlyPoint[]> {
  const today = todayInSaoPaulo();
  const [y, m] = today.slice(0, 7).split("-").map(Number);
  // Primeiro mês da janela (inclusive).
  const startIdx = m - 1 - (months - 1);
  const startY = y + Math.floor(startIdx / 12);
  const startM = ((startIdx % 12) + 12) % 12;
  const from = `${startY}-${String(startM + 1).padStart(2, "0")}-01`;

  const [revRows, payRows] = await Promise.all([
    db.execute<{ ym: string; cents: string }>(sql`
      SELECT to_char(check_in, 'YYYY-MM') AS ym, sum(total_price_cents)::bigint AS cents
      FROM ${reservation}
      WHERE status IN ${REVENUE_STATUSES} AND check_in >= ${from}::date
      GROUP BY ym`),
    db.execute<{ ym: string; cents: string }>(sql`
      SELECT to_char(paid_on, 'YYYY-MM') AS ym, sum(amount_cents)::bigint AS cents
      FROM ${payment}
      WHERE paid_on >= ${from}::date
      GROUP BY ym`),
  ]);

  const revMap = new Map(revRows.map((x) => [x.ym, Number(x.cents)]));
  const payMap = new Map(payRows.map((x) => [x.ym, Number(x.cents)]));

  const out: MonthlyPoint[] = [];
  for (let i = 0; i < months; i += 1) {
    const idx = startM + i;
    const yy = startY + Math.floor(idx / 12);
    const mm = (idx % 12) + 1;
    const key = `${yy}-${String(mm).padStart(2, "0")}`;
    out.push({
      month: key,
      revenueCents: revMap.get(key) ?? 0,
      receivedCents: payMap.get(key) ?? 0,
    });
  }
  return out;
}

/** Total recebido (pagamentos) no mês corrente (America/Sao_Paulo). */
export async function receivedThisMonthCents(): Promise<number> {
  const ym = todayInSaoPaulo().slice(0, 7);
  const rows = await db.execute<{ cents: string }>(sql`
    SELECT coalesce(sum(amount_cents), 0)::bigint AS cents
    FROM ${payment}
    WHERE to_char(paid_on, 'YYYY-MM') = ${ym}`);
  return Number(rows[0]?.cents ?? 0);
}

export type MethodTotal = { method: string; cents: number; count: number };

export async function paymentsByMethod(): Promise<MethodTotal[]> {
  const rows = await db.execute<{ method: string; cents: string; n: number }>(sql`
    SELECT method, sum(amount_cents)::bigint AS cents, count(*)::int AS n
    FROM ${payment}
    GROUP BY method
    ORDER BY cents DESC`);
  return rows.map((r) => ({ method: r.method, cents: Number(r.cents), count: Number(r.n) }));
}

export type StatusCount = { status: string; count: number };

export async function reservationsByStatus(): Promise<StatusCount[]> {
  const rows = await db.execute<{ status: string; n: number }>(sql`
    SELECT status, count(*)::int AS n FROM ${reservation} GROUP BY status ORDER BY n DESC`);
  return rows.map((r) => ({ status: r.status, count: Number(r.n) }));
}
