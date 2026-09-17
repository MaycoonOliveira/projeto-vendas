"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function iso(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}
function addDaysIso(value: string, days: number): string {
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

type DayAvailability = { date: string; occupied: boolean };

/**
 * Calendário visual de disponibilidade da propriedade (público). Mostra noites livres × reservadas
 * e permite selecionar o período (check-in → check-out) clicando. Os dados vêm de
 * `/api/calendario` (agregado, sem PII). Sincroniza com os campos de data do formulário.
 */
export function AvailabilityCalendar({
  checkin,
  checkout,
  minDate,
  onSelectRange,
}: {
  checkin: string;
  checkout: string;
  minDate: string;
  onSelectRange: (checkin: string, checkout: string) => void;
}) {
  const [cursor, setCursor] = useState(() => minDate.slice(0, 7)); // "YYYY-MM"
  // Resultado por janela: `key` identifica o mês carregado. Evita setState síncrono no efeito
  // (o loading é derivado de qual janela já respondeu).
  const [result, setResult] = useState<{
    key: string;
    days: Map<string, boolean>;
    error: string | null;
  } | null>(null);

  const [y, m] = cursor.split("-").map(Number);
  const from = iso(y, m, 1);
  const to = m === 12 ? iso(y + 1, 1, 1) : iso(y, m + 1, 1);
  const key = `${from}_${to}`;

  const loading = result?.key !== key;
  const days = result?.key === key ? result.days : new Map<string, boolean>();
  const error = result?.key === key ? result.error : null;

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    fetch(`/api/calendario?from=${from}&to=${to}`, { signal: controller.signal })
      .then(async (r) => {
        const data = (await r.json()) as { days?: DayAvailability[]; error?: string };
        if (!alive) return;
        if (!r.ok) {
          setResult({ key: `${from}_${to}`, days: new Map(), error: data.error ?? "Não foi possível carregar o calendário." });
          return;
        }
        setResult({
          key: `${from}_${to}`,
          days: new Map((data.days ?? []).map((d) => [d.date, d.occupied])),
          error: null,
        });
      })
      .catch((err) => {
        if (!alive) return;
        setResult({
          key: `${from}_${to}`,
          days: new Map(),
          error:
            err instanceof DOMException && err.name === "AbortError"
              ? "O calendário demorou a carregar. Tente novamente."
              : "Falha ao carregar o calendário.",
        });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      alive = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [from, to]);

  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells: (number | null)[] = useMemo(
    () => [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ],
    [firstWeekday, daysInMonth],
  );

  const canGoPrev = cursor > minDate.slice(0, 7);

  function shiftMonth(delta: number) {
    const nm = m - 1 + delta;
    const ny = y + Math.floor(nm / 12);
    const mm = ((nm % 12) + 12) % 12;
    setCursor(`${ny}-${pad(mm + 1)}`);
  }

  /** Há alguma noite ocupada em [a, b)? (usa só os dias carregados; outros meses = livres.) */
  function hasOccupiedBetween(a: string, b: string): boolean {
    for (let d = a; d < b; d = addDaysIso(d, 1)) {
      if (days.get(d)) return true;
    }
    return false;
  }

  function pickDay(date: string) {
    const occupied = days.get(date) === true;
    if (occupied || date < minDate) return;
    // Sem check-in, ou intervalo já completo, ou clique <= check-in → reinicia a seleção.
    if (!checkin || (checkin && checkout) || date <= checkin) {
      onSelectRange(date, "");
      return;
    }
    // date > checkin → define check-out se não houver noite ocupada no meio.
    if (hasOccupiedBetween(checkin, date)) {
      onSelectRange(date, "");
      return;
    }
    onSelectRange(checkin, date);
  }

  function dayState(date: string) {
    const occupied = days.get(date) === true;
    const past = date < minDate;
    const isCheckin = date === checkin;
    const isCheckout = date === checkout;
    const inRange =
      checkin && checkout && date > checkin && date < checkout;
    return { occupied, past, isCheckin, isCheckout, inRange };
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Mês anterior"
          className="inline-flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/5 disabled:opacity-30"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <h3 className="font-serif text-base font-semibold text-foreground" aria-live="polite">
          {MONTHS[m - 1]} {y}
        </h3>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Próximo mês"
          className="inline-flex size-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/5"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-foreground/40">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1">{w}</div>
        ))}
      </div>

      <div className="relative mt-1 grid grid-cols-7 gap-1" aria-busy={loading}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />;
          const date = iso(y, m, day);
          const { occupied, past, isCheckin, isCheckout, inRange } = dayState(date);
          const selectable = !occupied && !past;
          const selected = isCheckin || isCheckout;
          return (
            <button
              key={date}
              type="button"
              disabled={!selectable}
              onClick={() => pickDay(date)}
              aria-pressed={selected}
              aria-label={`${day} — ${
                past ? "indisponível" : occupied ? "reservado" : "livre"
              }`}
              className={[
                "flex min-h-11 items-center justify-center rounded-lg border text-sm transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : inRange
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : occupied
                      ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-700/80 line-through"
                      : past
                        ? "cursor-not-allowed border-transparent text-foreground/25"
                        : "border-border bg-white text-foreground/80 hover:border-primary hover:bg-primary/5",
              ].join(" ")}
            >
              {day}
            </button>
          );
        })}

        {loading ? (
          <div className="absolute inset-0 grid place-items-center rounded-lg bg-surface/70">
            <span className="text-xs text-muted-foreground">Carregando…</span>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded border border-border bg-white" /> Livre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded border border-amber-200 bg-amber-50" /> Reservado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded border border-primary bg-primary" /> Selecionado
        </span>
      </div>
    </div>
  );
}
