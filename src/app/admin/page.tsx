import Link from "next/link";
import { AlertCircle, LogIn, LogOut, PieChart, Wallet } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { MonthCalendar } from "@/components/admin/month-calendar";
import {
  checkInReservationAction,
  checkOutReservationAction,
} from "@/app/admin/reservas/actions";
import { receivedThisMonthCents } from "@/lib/services/finance";
import { requireAdmin } from "@/lib/dal";
import { formatDateBR, todayInSaoPaulo } from "@/lib/dates";
import { effectiveStatus, RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import { listAccommodations } from "@/lib/services/accommodation";
import { listOccupancyForCalendar } from "@/lib/services/block";
import {
  operationalSnapshot,
  upcomingArrivals,
  type ReservationListItem,
} from "@/lib/services/reservation-admin";
import { formatCentsBRL } from "@/lib/utils";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const idx = (m - 1 + delta + 12 * 100) % 12;
  const yy = y + Math.floor((m - 1 + delta) / 12);
  return { y: yy, m: idx + 1 };
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ acc?: string; month?: string }>;
}) {
  const session = await requireAdmin();
  const { acc, month } = await searchParams;

  const snap = await operationalSnapshot();
  const accommodations = await listAccommodations();
  const confirmedUpcoming = await upcomingArrivals(6);
  const monthRevenueCents = await receivedThisMonthCents();
  const activeAccs = accommodations.filter((a) => a.isActive);
  const selectedAcc = activeAccs.find((a) => a.id === acc) ?? activeAccs[0];

  const today = todayInSaoPaulo();
  const monthStr = month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
  const [y, m] = monthStr.split("-").map(Number);
  const rangeFrom = `${monthStr}-01`;
  const next = shiftMonth(y, m, 1);
  const prev = shiftMonth(y, m, -1);
  const rangeTo = `${next.y}-${pad(next.m)}-01`;

  const entries = selectedAcc
    ? await listOccupancyForCalendar(selectedAcc.id, rangeFrom, rangeTo)
    : [];

  const occPct =
    snap.activeAccommodations > 0
      ? Math.round((snap.occupiedToday / snap.activeAccommodations) * 100)
      : 0;

  const kpis = [
    { icon: LogIn, label: "Chegadas hoje", value: String(snap.arrivalsToday.length), href: "/admin/reservas?status=CONFIRMED", tone: "text-green-700 bg-green-50" },
    { icon: LogOut, label: "Saídas hoje", value: String(snap.departuresToday.length), href: "/admin/reservas?status=CONFIRMED", tone: "text-blue-700 bg-blue-50" },
    { icon: PieChart, label: "Ocupação hoje", value: `${occPct}%`, href: "/admin", tone: "text-foreground bg-muted" },
    { icon: Wallet, label: "Receita do mês", value: formatCentsBRL(monthRevenueCents), href: "/admin/financeiro", tone: "text-amber-700 bg-amber-50" },
  ];

  const accHref = (id: string) => `/admin?acc=${id}&month=${monthStr}`;
  const monthHref = (mm: { y: number; m: number }) =>
    `/admin?${selectedAcc ? `acc=${selectedAcc.id}&` : ""}month=${mm.y}-${pad(mm.m)}`;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Olá, {session.name?.split(" ")[0] ?? "admin"}
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            {new Date(today + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}{" "}
            · {snap.occupiedToday}/{snap.activeAccommodations} ocupada(s) hoje ({occPct}%)
          </p>
        </div>
        <Link href="/admin/reservas/nova" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
          Nova reserva
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="rounded-xl border border-border bg-white p-4 transition-colors hover:border-primary/40">
            <span className={`inline-flex size-9 items-center justify-center rounded-full ${k.tone}`}>
              <k.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-3 text-2xl font-semibold text-foreground">{k.value}</p>
            <p className="text-xs text-foreground/50">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Precisa de atenção */}
      {(snap.pendingCount > 0 || snap.expiringHolds.length > 0) && (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertCircle className="size-4" aria-hidden /> Precisa de atenção
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900/80">
            {snap.pendingCount > 0 && (
              <li>
                <Link href="/admin/reservas?status=PENDING" className="hover:underline">
                  {snap.pendingCount} reserva(s) pendente(s) aguardando confirmação →
                </Link>
              </li>
            )}
            {snap.expiringHolds.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reservas/${r.id}`} className="hover:underline">
                  Hold de {r.guestName} expira{" "}
                  {r.holdExpiresAt ? new Date(r.holdExpiresAt).toLocaleString("pt-BR") : ""} →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Calendário mensal de ocupação (no painel principal) */}
      {selectedAcc ? (
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">Calendário de reservas</h2>
            {activeAccs.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {activeAccs.map((a) => (
                  <Link
                    key={a.id}
                    href={accHref(a.id)}
                    aria-current={a.id === selectedAcc.id ? "true" : undefined}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      a.id === selectedAcc.id
                        ? "bg-foreground text-white"
                        : "border border-border text-foreground/70 hover:bg-foreground/5"
                    }`}
                  >
                    {a.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <div className="mt-3">
            <MonthCalendar
              month={monthStr}
              entries={entries}
              today={today}
              prevHref={monthHref(prev)}
              nextHref={monthHref(next)}
            />
          </div>
        </section>
      ) : (
        <p className="mt-6 rounded-xl border border-border bg-white p-5 text-sm text-foreground/50">
          Cadastre uma acomodação ativa para ver o calendário.
        </p>
      )}

      {/* Chegadas e saídas de hoje */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TodayList title="Chegadas de hoje" items={snap.arrivalsToday} empty="Nenhuma chegada hoje." quick="checkin" />
        <TodayList title="Saídas de hoje" items={snap.departuresToday} empty="Nenhuma saída hoje." quick="checkout" />
      </div>

      {/* Próximas reservas confirmadas */}
      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-foreground">Reservas confirmadas</h2>
          <Link href="/admin/reservas?status=CONFIRMED" className="text-sm font-medium text-primary hover:underline">
            Ver todas →
          </Link>
        </div>
        {confirmedUpcoming.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">Nenhuma reserva confirmada nas próximas datas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {confirmedUpcoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/admin/reservas/${r.id}`} className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{r.guestName}</span>
                  <span className="block truncate text-xs text-foreground/50">
                    {r.accommodationName} · {formatDateBR(r.checkIn)} → {formatDateBR(r.checkOut)} · {formatCentsBRL(r.totalPriceCents)}
                  </span>
                </Link>
                <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  Confirmada
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function TodayList({
  title,
  items,
  empty,
  quick,
}: {
  title: string;
  items: ReservationListItem[];
  empty: string;
  quick?: "checkin" | "checkout";
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/50">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {items.map((r) => {
            const eff = effectiveStatus(r.status, r.holdExpiresAt);
            const badge = RESERVATION_STATUS_LABEL[eff] ?? RESERVATION_STATUS_LABEL.PENDING;
            const showCheckin = quick === "checkin" && eff === "CONFIRMED";
            const showCheckout = quick === "checkout" && eff === "CHECKED_IN";
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/admin/reservas/${r.id}`} className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{r.guestName}</span>
                  <span className="block truncate text-xs text-foreground/50">
                    {r.accommodationName} · {r.guestsCount} hóspede(s) · {formatCentsBRL(r.totalPriceCents)}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {showCheckin ? (
                    <form action={checkInReservationAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                        Check-in
                      </button>
                    </form>
                  ) : showCheckout ? (
                    <form action={checkOutReservationAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">
                        Check-out
                      </button>
                    </form>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
