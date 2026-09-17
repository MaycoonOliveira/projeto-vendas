import Link from "next/link";
import { AlertCircle, CalendarClock, LogIn, LogOut, Users } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { addDays, todayInSaoPaulo } from "@/lib/dates";
import { effectiveStatus, RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import { listAccommodations } from "@/lib/services/accommodation";
import { listOccupancyForCalendar } from "@/lib/services/block";
import {
  operationalSnapshot,
  type ReservationListItem,
} from "@/lib/services/reservation-admin";
import { formatCentsBRL } from "@/lib/utils";

const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const snap = await operationalSnapshot();
  const accommodations = await listAccommodations();
  const primary = accommodations.find((a) => a.isActive) ?? accommodations[0];

  const today = todayInSaoPaulo();
  const stripEnd = addDays(today, 14);
  const entries = primary
    ? await listOccupancyForCalendar(primary.id, today, stripEnd)
    : [];

  const occPct =
    snap.activeAccommodations > 0
      ? Math.round((snap.occupiedToday / snap.activeAccommodations) * 100)
      : 0;

  const kpis = [
    { icon: LogIn, label: "Chegadas hoje", value: snap.arrivalsToday.length, href: "/admin/reservas?status=CONFIRMED", tone: "text-green-700 bg-green-50" },
    { icon: LogOut, label: "Saídas hoje", value: snap.departuresToday.length, href: "/admin/reservas?status=CONFIRMED", tone: "text-blue-700 bg-blue-50" },
    { icon: Users, label: "Hospedados", value: snap.inHouse.length, href: "/admin/calendario", tone: "text-foreground bg-muted" },
    { icon: CalendarClock, label: "Pendentes", value: snap.pendingCount, href: "/admin/reservas?status=PENDING", tone: "text-amber-700 bg-amber-50" },
  ];

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

      {/* Mini-calendário (14 dias) */}
      {primary && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-foreground">Próximos 14 dias</h2>
            <Link href="/admin/calendario" className="text-sm font-medium text-primary hover:underline">
              Calendário completo →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 14 }, (_, i) => {
              const iso = addDays(today, i);
              const wd = new Date(iso + "T12:00:00").getDay();
              const hit = entries.find((e) => e.checkIn <= iso && iso < e.checkOut);
              const tone = hit
                ? hit.type === "BLOCK"
                  ? "border-neutral-200 bg-neutral-100 text-neutral-500"
                  : "border-amber-200 bg-amber-50 text-amber-800"
                : "border-border bg-white text-foreground/70";
              return (
                <div key={iso} className={`rounded-lg border p-1.5 text-center ${tone}`} title={hit ? (hit.type === "BLOCK" ? "Bloqueio" : `Reserva ${hit.publicCode}`) : "Livre"}>
                  <div className="text-[10px] uppercase text-foreground/40">{WD[wd]}</div>
                  <div className="text-sm font-medium">{iso.slice(8)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Chegadas e saídas de hoje */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TodayList title="Chegadas de hoje" items={snap.arrivalsToday} empty="Nenhuma chegada hoje." />
        <TodayList title="Saídas de hoje" items={snap.departuresToday} empty="Nenhuma saída hoje." />
      </div>
    </AdminShell>
  );
}

function TodayList({
  title,
  items,
  empty,
}: {
  title: string;
  items: ReservationListItem[];
  empty: string;
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
            return (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/admin/reservas/${r.id}`} className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{r.guestName}</span>
                  <span className="block truncate text-xs text-foreground/50">
                    {r.accommodationName} · {r.guestsCount} hóspede(s) · {formatCentsBRL(r.totalPriceCents)}
                  </span>
                </Link>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
