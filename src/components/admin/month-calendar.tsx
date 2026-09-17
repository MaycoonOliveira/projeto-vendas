import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { CalendarEntry } from "@/lib/services/block";

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

export type MonthCalendarProps = {
  /** Mês exibido no formato "YYYY-MM". */
  month: string;
  /** Ocupações ativas no mês (reservas/bloqueios), já filtradas por acomodação. */
  entries: CalendarEntry[];
  /** Data de hoje (YYYY-MM-DD) para destaque. */
  today: string;
  /** Links de navegação (mês anterior/seguinte). */
  prevHref: string;
  nextHref: string;
};

/**
 * Grade mensal de ocupação (reserva × bloqueio × livre). Componente de servidor puro —
 * usado no painel principal do admin. Mostra a mesma linguagem visual do calendário público.
 */
export function MonthCalendar({ month, entries, today, prevHref, nextHref }: MonthCalendarProps) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();

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

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between">
        <Link
          href={prevHref}
          aria-label="Mês anterior"
          className="inline-flex size-9 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/5"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h2 className="font-serif text-lg font-semibold text-foreground">
          {MONTHS[m - 1]} {y}
        </h2>
        <Link
          href={nextHref}
          aria-label="Próximo mês"
          className="inline-flex size-9 items-center justify-center rounded-full text-foreground/70 hover:bg-foreground/5"
        >
          <ChevronRight className="size-5" aria-hidden />
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
          const style = entry
            ? entry.type === "BLOCK"
              ? "border-neutral-200 bg-neutral-100 text-neutral-600"
              : "border-amber-200 bg-amber-50 text-amber-800"
            : "border-border bg-white text-foreground/70";
          return (
            <div
              key={iso}
              className={`flex min-h-14 flex-col rounded-lg border p-1.5 text-xs ${style} ${
                isToday ? "ring-2 ring-primary/40" : ""
              }`}
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
  );
}
