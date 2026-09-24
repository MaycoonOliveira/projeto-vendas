import type { Metadata } from "next";
import { BadgeDollarSign, Clock, TrendingUp, Wallet } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { requireOwner } from "@/lib/dal";
import { RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import {
  financeKpis,
  paymentsByMethod,
  reservationsByStatus,
  revenueByMonth,
} from "@/lib/services/finance";
import { PAYMENT_METHOD_LABEL } from "@/lib/services/payment";
import { formatCentsBRL } from "@/lib/utils";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  await requireOwner();

  // Sequencial de propósito: o pooler de transação do Supabase trava quando o
  // número de queries SIMULTÂNEAS passa do `max` do pool (ver src/db/index.ts).
  // Esta página, somada ao polling do admin (me/notificações/poll-updates),
  // estourava o limite e a tela ficava presa no skeleton. Rodar em série mantém
  // a concorrência baixa; o custo total é de ~1–2s, aceitável para o financeiro.
  const kpis = await financeKpis();
  const monthly = await revenueByMonth(12);
  const byStatus = await reservationsByStatus();
  const byMethod = await paymentsByMethod();

  const cards = [
    { icon: TrendingUp, label: "Receita confirmada", value: formatCentsBRL(kpis.confirmedRevenueCents), hint: `${kpis.confirmedCount} reserva(s)`, tone: "text-green-700 bg-green-50" },
    { icon: Wallet, label: "Recebido", value: formatCentsBRL(kpis.receivedCents), hint: "pagamentos registrados", tone: "text-amber-700 bg-amber-50" },
    { icon: BadgeDollarSign, label: "A receber", value: formatCentsBRL(kpis.outstandingCents), hint: "saldo das confirmadas", tone: "text-blue-700 bg-blue-50" },
    { icon: Clock, label: "A confirmar", value: formatCentsBRL(kpis.pendingRevenueCents), hint: `${kpis.pendingCount} pendente(s)`, tone: "text-foreground bg-muted" },
  ];

  const statusMax = Math.max(1, ...byStatus.map((s) => s.count));
  const methodMax = Math.max(1, ...byMethod.map((m) => m.cents));

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Financeiro</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Derivado das reservas e dos pagamentos registrados. Ticket médio:{" "}
            <strong className="text-foreground">{formatCentsBRL(kpis.avgTicketCents)}</strong>.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-white p-4">
            <span className={`inline-flex size-9 items-center justify-center rounded-full ${c.tone}`}>
              <c.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-xl font-semibold text-foreground">{c.value}</p>
            <p className="text-xs text-foreground/50">{c.label}</p>
            <p className="text-[11px] text-foreground/40">{c.hint}</p>
          </div>
        ))}
      </div>

      {/* Faturamento por mês */}
      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <h2 className="font-serif text-lg font-semibold text-foreground">Faturamento por mês</h2>
        <p className="mt-1 text-xs text-foreground/50">
          Previsto = reservas confirmadas (por mês de check-in). Recebido = pagamentos (por data).
        </p>
        <div className="mt-4">
          <RevenueChart data={monthly} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Reservas por status */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">Reservas por status</h2>
          {byStatus.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/50">Sem reservas.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {byStatus.map((s) => {
                const label = RESERVATION_STATUS_LABEL[s.status]?.label ?? s.status;
                return (
                  <li key={s.status} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2 text-sm">
                    <span className="truncate text-foreground/70">{label}</span>
                    <span className="h-2.5 rounded-full bg-muted" aria-hidden>
                      <span
                        className="block h-2.5 rounded-full bg-primary/70"
                        style={{ width: `${Math.round((s.count / statusMax) * 100)}%` }}
                      />
                    </span>
                    <span className="text-right font-medium text-foreground">{s.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Pagamentos por método */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">Pagamentos por método</h2>
          {byMethod.length === 0 ? (
            <p className="mt-3 text-sm text-foreground/50">Nenhum pagamento registrado.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {byMethod.map((m) => (
                <li key={m.method} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm">
                  <span className="truncate text-foreground/70">
                    {PAYMENT_METHOD_LABEL[m.method] ?? m.method}
                    <span className="text-foreground/40"> ({m.count})</span>
                  </span>
                  <span className="h-2.5 rounded-full bg-muted" aria-hidden>
                    <span
                      className="block h-2.5 rounded-full"
                      style={{ width: `${Math.round((m.cents / methodMax) * 100)}%`, backgroundColor: "#cf9440" }}
                    />
                  </span>
                  <span className="text-right font-medium text-foreground">{formatCentsBRL(m.cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
