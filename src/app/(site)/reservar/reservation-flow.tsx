"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatCentsBRL } from "@/lib/utils";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1.5 block text-xs font-medium text-foreground/70";

type AvailabilityResult = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  capacity: number;
  minNights: number;
  price: { nights: number; totalCents: number; currency: string };
};

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
}

/** fetch com timeout (evita spinner infinito se o banco demorar a "acordar"). */
async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  ms = 30_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function ReservationFlow() {
  const router = useRouter();
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(2);

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AvailabilityResult[] | null>(null);
  const [selected, setSelected] = useState<AvailabilityResult | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const minDate = todayISO();

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResults(null);
    setSelected(null);
    setSearching(true);
    try {
      const qs = new URLSearchParams({ checkin, checkout, guests: String(guests) });
      const res = await fetchWithTimeout(`/api/disponibilidade?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível consultar a disponibilidade.");
        return;
      }
      setResults(data.results as AvailabilityResult[]);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "A consulta demorou demais. Tente novamente em instantes."
          : "Falha de conexão. Tente novamente.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetchWithTimeout("/api/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          accommodationId: selected.id,
          checkin,
          checkout,
          guestsCount: guests,
          guest: { fullName, email, phone, notes: notes || undefined },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível concluir a reserva.");
        // Datas ficaram indisponíveis → volta para a busca.
        if (res.status === 409) {
          setSelected(null);
          setResults(null);
        }
        return;
      }
      router.push(`/reserva/${data.publicCode}`);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === "AbortError"
          ? "A solicitação demorou demais. Tente novamente em instantes."
          : "Falha de conexão. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Passo 1 — datas e hóspedes */}
      <form
        onSubmit={search}
        className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="checkin" className={labelClass}>
              Check-in
            </label>
            <input
              id="checkin"
              type="date"
              required
              min={minDate}
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="checkout" className={labelClass}>
              Check-out
            </label>
            <input
              id="checkout"
              type="date"
              required
              min={checkin || minDate}
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="guests" className={labelClass}>
              Hóspedes
            </label>
            <input
              id="guests"
              type="number"
              min={1}
              max={50}
              required
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <Button type="submit" size="md" className="mt-5 w-full" disabled={searching}>
          {searching ? "Consultando…" : "Ver disponibilidade"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {/* Passo 2 — resultados */}
      {results && !selected ? (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
              Nenhuma acomodação disponível para essas datas. Tente outro período.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {results.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
                >
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    {r.name}
                  </h3>
                  {r.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {formatCentsBRL(r.price.totalCents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.price.nights} noite{r.price.nights > 1 ? "s" : ""} · até{" "}
                        {r.capacity} hóspedes
                      </p>
                    </div>
                    <Button type="button" size="md" onClick={() => setSelected(r)}>
                      Reservar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Passo 3 — dados do hóspede */}
      {selected ? (
        <form
          onSubmit={submit}
          className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                {selected.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {checkin} → {checkout} · {guests} hóspede{guests > 1 ? "s" : ""} ·{" "}
                <strong className="text-foreground">
                  {formatCentsBRL(selected.price.totalCents)}
                </strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Trocar
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Nome completo
              </label>
              <input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={labelClass}>
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Telefone / WhatsApp
                </label>
                <input
                  id="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>
                Observações (opcional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputClass} h-auto py-2`}
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Ao solicitar, sua reserva fica <strong>pendente</strong> por até 24h enquanto
            confirmamos o pagamento por contato. Não pedimos dados de cartão neste site.
          </p>

          <Button type="submit" size="md" className="mt-5 w-full" disabled={submitting}>
            {submitting ? "Enviando…" : "Solicitar reserva"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
