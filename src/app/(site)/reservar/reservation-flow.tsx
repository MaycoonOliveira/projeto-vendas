"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCentsBRL } from "@/lib/utils";
import { formatDateBR } from "@/lib/dates";
import { maskPhoneBR } from "@/lib/masks";
import { perNightSummary } from "@/lib/payment-status";
import { AvailabilityCalendar } from "./availability-calendar";
import { PhotoCarousel } from "./photo-carousel";

const inputBase =
  "h-11 w-full rounded-xl border bg-surface px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1.5 block text-xs font-medium text-foreground/70";

function inputClass(hasError: boolean): string {
  return `${inputBase} ${
    hasError
      ? "border-red-300 focus-visible:border-red-400"
      : "border-border focus-visible:border-primary"
  }`;
}

type AvailabilityResult = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  capacity: number;
  minNights: number;
  photos: { url: string; alt: string | null }[];
  price: { nights: number; totalCents: number; currency: string };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const STEPS = ["Datas", "Escolha", "Seus dados"] as const;

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center justify-center gap-2 sm:gap-4" aria-label="Etapas da reserva">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                aria-current={active ? "step" : undefined}
                className={[
                  "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                      : "bg-muted text-foreground/50",
                ].join(" ")}
              >
                {done ? <Check className="size-4" aria-hidden /> : step}
              </span>
              <span
                className={`hidden text-sm sm:inline ${
                  active ? "font-medium text-foreground" : "text-foreground/50"
                }`}
              >
                {label}
              </span>
            </div>
            {step < STEPS.length ? (
              <span className="h-px w-6 bg-border sm:w-10" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** Placeholder animado enquanto a disponibilidade é consultada. */
function ResultsSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
        >
          <div className="h-5 w-2/5 rounded bg-foreground/10" />
          <div className="mt-3 h-3 w-3/4 rounded bg-foreground/10" />
          <div className="mt-6 flex items-center justify-between">
            <div className="h-6 w-24 rounded bg-foreground/10" />
            <div className="h-10 w-28 rounded-full bg-foreground/10" />
          </div>
        </div>
      ))}
    </div>
  );
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
  const [touched, setTouched] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const minDate = todayISO();

  const currentStep = selected ? 3 : results ? 2 : 1;

  // Validação inline das datas.
  const dateError =
    checkin && checkout && checkout <= checkin
      ? "O check-out deve ser depois do check-in."
      : "";
  const guestsError = guests < 1 ? "Informe ao menos 1 hóspede." : "";
  const canSearch = Boolean(checkin && checkout) && !dateError && !guestsError;

  // Validação inline dos dados do hóspede.
  const nameError = touched && !fullName.trim() ? "Informe o nome completo." : "";
  const emailError = touched && !EMAIL_RE.test(email) ? "Informe um e-mail válido." : "";
  const phoneError = touched && !phone.trim() ? "Informe um telefone de contato." : "";

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!canSearch) return;
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
    setTouched(true);
    if (nameError || emailError || phoneError || !fullName.trim() || !EMAIL_RE.test(email) || !phone.trim()) {
      return;
    }
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
      <Stepper current={currentStep} />

      {/* Passo 1 — calendário + datas e hóspedes */}
      <form
        onSubmit={search}
        className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
      >
        <p className="mb-4 text-sm text-muted-foreground">
          Selecione as datas no calendário ou informe abaixo. As noites em{" "}
          <span className="font-medium text-amber-700">laranja</span> já estão reservadas.
        </p>

        <AvailabilityCalendar
          checkin={checkin}
          checkout={checkout}
          minDate={minDate}
          onSelectRange={(ci, co) => {
            setCheckin(ci);
            setCheckout(co);
          }}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
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
              onChange={(e) => {
                setCheckin(e.target.value);
                if (checkout && e.target.value >= checkout) setCheckout("");
              }}
              className={inputClass(false)}
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
              aria-invalid={Boolean(dateError)}
              className={inputClass(Boolean(dateError))}
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
              aria-invalid={Boolean(guestsError)}
              className={inputClass(Boolean(guestsError))}
            />
          </div>
        </div>

        {dateError || guestsError ? (
          <p role="alert" className="mt-2 text-xs text-red-700">
            {dateError || guestsError}
          </p>
        ) : null}

        <Button
          type="submit"
          size="md"
          className="mt-5 w-full"
          disabled={searching || !canSearch}
        >
          {searching ? "Consultando…" : "Ver disponibilidade"}
        </Button>
      </form>

      {/* Região de status para leitores de tela. */}
      <p className="sr-only" role="status" aria-live="polite">
        {searching
          ? "Consultando disponibilidade."
          : results
            ? `${results.length} acomodação(ões) disponível(is).`
            : ""}
      </p>

      {error ? (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {/* Passo 2 — resultados */}
      {searching ? <ResultsSkeleton /> : null}

      {!searching && results && !selected ? (
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
                  className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]"
                >
                  {r.photos.length > 0 ? (
                    <PhotoCarousel photos={r.photos} name={r.name} />
                  ) : null}
                  <div className="p-6">
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
                        {perNightSummary(r.price.totalCents, r.price.nights)} · até{" "}
                        {r.capacity} hóspedes
                      </p>
                    </div>
                    <Button type="button" size="md" onClick={() => setSelected(r)}>
                      Reservar
                    </Button>
                  </div>
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
          noValidate
          className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]"
        >
          {selected.photos.length > 0 ? (
            <PhotoCarousel photos={selected.photos} name={selected.name} aspect="aspect-[16/9]" />
          ) : null}
          <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                {selected.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Período:{" "}
                <strong className="text-foreground">
                  {formatDateBR(checkin)} - {formatDateBR(checkout)}
                </strong>{" "}
                ({selected.price.nights} noite{selected.price.nights > 1 ? "s" : ""})
              </p>
              <p className="text-sm text-muted-foreground">
                {guests} hóspede{guests > 1 ? "s" : ""} ·{" "}
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
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "fullName-error" : undefined}
                className={inputClass(Boolean(nameError))}
              />
              {nameError ? (
                <p id="fullName-error" role="alert" className="mt-1 text-xs text-red-700">
                  {nameError}
                </p>
              ) : null}
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
                  inputMode="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={inputClass(Boolean(emailError))}
                />
                {emailError ? (
                  <p id="email-error" role="alert" className="mt-1 text-xs text-red-700">
                    {emailError}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Telefone / WhatsApp
                </label>
                <input
                  id="phone"
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="(24) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                  className={inputClass(Boolean(phoneError))}
                />
                {phoneError ? (
                  <p id="phone-error" role="alert" className="mt-1 text-xs text-red-700">
                    {phoneError}
                  </p>
                ) : null}
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
                className={`${inputClass(false)} h-auto py-2`}
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
          </div>
        </form>
      ) : null}
    </div>
  );
}
