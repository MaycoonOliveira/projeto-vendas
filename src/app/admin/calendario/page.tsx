import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { todayInSaoPaulo } from "@/lib/dates";
import { listAccommodations } from "@/lib/services/accommodation";
import {
  listOccupancyForCalendar,
  type CalendarEntry,
} from "@/lib/services/block";

export const metadata: Metadata = { title: "Calendário" };

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}
function shiftMonth(y: number, m: number, delta: number): { y: number; m: number } {
  const idx = (m - 1 + delta + 12 * 100) % 12;
  const yy = y + Math.floor((m - 1 + delta) / 12);
  return { y: yy, m: idx + 1 };
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ acc?: string; month?: string }>;
}) {
  await requireAdmin();
  const { acc, month } = await searchParams;

  const accommodations = (await listAccommodations()).filter((a) => a.isActive);
  if (accommodations.length === 0) {
    return (
      <AdminShell>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Calendário</h1>
        <p className="mt-4 text-sm text-foreground/50">Cadastre uma acomodação ativa.</p>
      </AdminShell>
    );
  }

  const selectedAcc = accommodations.find((a) => a.id === acc) ?? accommodations[0];

  const today = todayInSaoPaulo();
  const monthStr = month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
  const [y, m] = monthStr.split("-").map(Number);

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const rangeFrom = isoDate(y, m, 1);
  const next = shiftMonth(y, m, 1);
  const rangeTo = isoDate(next.y, next.m, 1);
  const prev = shiftMonth(y, m, -1);

  const entries = await listOccupancyForCalendar(selectedAcc.id, rangeFrom, rangeTo);

  // Mapa dia -> entrada (uma noite d está ocupada se checkIn <= d < checkOut).
  const byDay = new Map<string, CalendarEntry>();
  for (let d = 1; d <= daysInMonth; d += 1) {
    const iso = isoDate(y, m, d);
    const hit = entries.find((e) => e.checkIn <= iso && iso < e.checkOut);
    if (hit) byDay.set(iso, hit);
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLink = (mm: { y: number; m: number }) =>
    `/admin/calendario?acc=${selectedAcc.id}&month=${mm.y}-${pad(mm.m)}`;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Calendário</h1>
        {accommodations.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {accommodations.map((a) => (
              <Link
                key={a.id}
                href={`/admin/calendario?acc=${a.id}&month=${monthStr}`}
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

      <div className="mt-6 rounded-xl border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <Link href={monthLink(prev)} className="rounded-full px-3 py-1.5 text-sm text-foreground/70 hover:bg-foreground/5">
            ← {MONTHS[prev.m - 1]}
          </Link>
          <h2 className="font-serif text-lg font-semibold text-foreground">
            {MONTHS[m - 1]} {y}
          </h2>
          <Link href={monthLink(next)} className="rounded-full px-3 py-1.5 text-sm text-foreground/70 hover:bg-foreground/5">
            {MONTHS[next.m - 1]} →
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-foreground/40">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="py-1">{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />;
            const iso = isoDate(y, m, day);
            const entry = byDay.get(iso);
            const isToday = iso === today;
            const base =
              "flex min-h-14 flex-col rounded-lg border p-1.5 text-xs";
            const style = entry
              ? entry.type === "BLOCK"
                ? "border-neutral-200 bg-neutral-100 text-neutral-600"
                : "border-amber-200 bg-amber-50 text-amber-800"
              : "border-border bg-white text-foreground/70";
            return (
              <div
                key={iso}
                className={`${base} ${style}`}
                title={
                  entry
                    ? entry.type === "BLOCK"
                      ? `Bloqueio${entry.label ? ` — ${entry.label}` : ""}`
                      : `Reserva ${entry.publicCode} (${entry.status})`
                    : "Livre"
                }
              >
                <span className={`font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                {entry ? (
                  <span className="mt-auto truncate text-[10px]">
                    {entry.type === "BLOCK" ? "Bloqueio" : "Reserva"}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-4 text-xs text-foreground/50">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-amber-200 bg-amber-50" /> Reserva
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded border border-neutral-200 bg-neutral-100" /> Bloqueio
          </span>
        </div>
      </div>
    </AdminShell>
  );
}
