import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireAdmin } from "@/lib/dal";
import { todayInSaoPaulo } from "@/lib/dates";
import { effectiveStatus, RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import { getReservationAdmin } from "@/lib/services/reservation-admin";
import { listPhotos } from "@/lib/services/accommodation-photo";
import { PAYMENT_METHOD_LABEL } from "@/lib/services/payment";
import { formatCentsBRL } from "@/lib/utils";
import {
  cancelReservationAction,
  checkInReservationAction,
  checkOutReservationAction,
  confirmReservationAction,
  deletePaymentAction,
  noShowReservationAction,
  recordPaymentAction,
  updateInternalNoteAction,
} from "../actions";
import { ReservationEditForm } from "./reservation-edit-form";

export const metadata: Metadata = { title: "Reserva" };

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const data = await getReservationAdmin(id);
  if (!data) notFound();

  const { reservation: r, guest, accommodation, history, payments, paidCents } = data;
  const photos = accommodation ? await listPhotos(accommodation.id) : [];
  const cover = photos[0];
  const eff = effectiveStatus(r.status, r.holdExpiresAt);
  const badge = RESERVATION_STATUS_LABEL[eff] ?? RESERVATION_STATUS_LABEL.PENDING;
  const editable = eff === "PENDING" || eff === "CONFIRMED";
  const today = todayInSaoPaulo();
  const balanceCents = r.totalPriceCents - paidCents;

  return (
    <AdminShell>
      <Link href="/admin/reservas" className="text-sm text-foreground/60 hover:text-foreground">
        ← Reservas
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-mono text-2xl font-semibold tracking-wider text-foreground">
          {r.publicCode}
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        {r.source === "MANUAL" ? (
          <span className="rounded bg-foreground/5 px-2 py-1 text-xs text-foreground/50">manual</span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Reserva */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Reserva</h2>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.url}
              alt={cover.alt ?? accommodation?.name ?? "Acomodação"}
              loading="lazy"
              className="mt-3 aspect-[16/9] w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Acomodação" value={accommodation?.name ?? "—"} />
            <Row label="Período" value={`${r.checkIn} → ${r.checkOut} (${r.nights} noite${r.nights > 1 ? "s" : ""})`} />
            <Row label="Hóspedes" value={String(r.guestsCount)} />
            <Row label="Total" value={formatCentsBRL(r.totalPriceCents)} />
            <Row label="Origem" value={r.source} />
            {r.holdExpiresAt ? (
              <Row label="Hold expira" value={new Date(r.holdExpiresAt).toLocaleString("pt-BR")} />
            ) : null}
            {r.cancelledReason ? <Row label="Motivo cancelamento" value={r.cancelledReason} /> : null}
          </dl>
        </section>

        {/* Hóspede (PII — só admin) */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Hóspede</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="Nome" value={guest?.fullName ?? "—"} />
            <Row label="E-mail" value={guest?.email ?? "—"} />
            <Row label="Telefone" value={guest?.phone ?? "—"} />
            {guest?.notes ? <Row label="Observações" value={guest.notes} /> : null}
          </dl>
        </section>
      </div>

      {/* Ações de status */}
      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-foreground">Ações</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {eff === "PENDING" ? (
            <form action={confirmReservationAction}>
              <input type="hidden" name="id" value={r.id} />
              <SubmitButton pendingLabel="Confirmando…" className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Confirmar
              </SubmitButton>
            </form>
          ) : null}
          {eff === "CONFIRMED" ? (
            <>
              <form action={checkInReservationAction}>
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  Fazer check-in
                </SubmitButton>
              </form>
              <form action={noShowReservationAction}>
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-foreground/5">
                  Não compareceu
                </SubmitButton>
              </form>
            </>
          ) : null}
          {eff === "CHECKED_IN" ? (
            <form action={checkOutReservationAction}>
              <input type="hidden" name="id" value={r.id} />
              <SubmitButton pendingLabel="Processando…" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Fazer check-out
              </SubmitButton>
            </form>
          ) : null}
          {eff === "PENDING" || eff === "CONFIRMED" ? (
            <form action={cancelReservationAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input
                name="reason"
                placeholder="Motivo (opcional)"
                className="h-9 rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary"
              />
              <SubmitButton pendingLabel="Cancelando…" className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                Cancelar reserva
              </SubmitButton>
            </form>
          ) : null}
          {eff !== "PENDING" && eff !== "CONFIRMED" && eff !== "CHECKED_IN" ? (
            <p className="text-sm text-foreground/50">
              Reserva em estado terminal — sem ações de status disponíveis.
            </p>
          ) : null}
        </div>
      </section>

      {/* Pagamentos (registro manual — Fase 8.3) */}
      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">Pagamentos</h2>
          <div className="flex gap-4 text-sm">
            <span className="text-foreground/60">
              Pago: <strong className="text-foreground">{formatCentsBRL(paidCents)}</strong>
            </span>
            <span className={balanceCents > 0 ? "text-amber-700" : "text-green-700"}>
              {balanceCents > 0
                ? `Saldo: ${formatCentsBRL(balanceCents)}`
                : "Quitada"}
            </span>
          </div>
        </div>

        {payments.length > 0 ? (
          <ul className="mt-3 divide-y divide-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-foreground/80">
                  <strong className="text-foreground">{formatCentsBRL(p.amountCents)}</strong>{" "}
                  · {PAYMENT_METHOD_LABEL[p.method] ?? p.method} · {p.paidOn}
                  {p.note ? <span className="text-foreground/50"> · {p.note}</span> : null}
                </span>
                <form action={deletePaymentAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="reservationId" value={r.id} />
                  <SubmitButton className="rounded-full px-2 py-1 text-xs text-red-600 hover:bg-red-50" aria-label="Remover pagamento">
                    Remover
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-foreground/50">Nenhum pagamento registrado.</p>
        )}

        <form action={recordPaymentAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1.4fr_auto] sm:items-end">
          <input type="hidden" name="reservationId" value={r.id} />
          <div>
            <label htmlFor="amount" className="mb-1 block text-xs font-medium text-foreground/70">Valor (R$)</label>
            <input id="amount" name="amount" type="number" step="0.01" min="0.01" required
              defaultValue={balanceCents > 0 ? (balanceCents / 100).toFixed(2) : ""}
              className="h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25" />
          </div>
          <div>
            <label htmlFor="paidOn" className="mb-1 block text-xs font-medium text-foreground/70">Data</label>
            <input id="paidOn" name="paidOn" type="date" required defaultValue={today}
              className="h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25" />
          </div>
          <div>
            <label htmlFor="method" className="mb-1 block text-xs font-medium text-foreground/70">Método</label>
            <select id="method" name="method" required
              className="h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25">
              {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="note" className="mb-1 block text-xs font-medium text-foreground/70">Observação (opcional)</label>
            <input id="note" name="note" className="h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25" />
          </div>
          <SubmitButton pendingLabel="Registrando…" className="h-10 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
            Registrar
          </SubmitButton>
        </form>
      </section>

      {/* Nota interna (admin) — distinta da observação do hóspede */}
      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-foreground">Nota interna</h2>
        <p className="mt-1 text-xs text-foreground/50">
          Visível apenas para a equipe. Não é compartilhada com o hóspede.
        </p>
        <form action={updateInternalNoteAction} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="id" value={r.id} />
          <textarea
            name="internalNote"
            rows={3}
            defaultValue={r.internalNote ?? ""}
            placeholder="Ex.: hóspede chega após as 22h; combinado desconto por indicação…"
            className="w-full rounded-lg border border-foreground/15 bg-white px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          <div>
            <SubmitButton pendingLabel="Salvando…" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/5">
              Salvar nota
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* Edição (datas/hóspedes) */}
      {editable ? (
        <section className="mt-6 rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Editar datas / hóspedes</h2>
          <p className="mt-1 text-xs text-foreground/50">
            O preço é recalculado no servidor. Conflitos de calendário são bloqueados.
          </p>
          <div className="mt-3">
            <ReservationEditForm
              id={r.id}
              version={r.version}
              checkIn={r.checkIn}
              checkOut={r.checkOut}
              guestsCount={r.guestsCount}
            />
          </div>
        </section>
      ) : null}

      {/* Histórico */}
      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-2 text-foreground/70">
              <span className="text-xs text-foreground/40">
                {new Date(h.createdAt).toLocaleString("pt-BR")}
              </span>
              <span>
                {h.fromStatus ? `${h.fromStatus} → ` : ""}
                <strong className="text-foreground/80">{h.toStatus}</strong>
                {h.reason ? ` · ${h.reason}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-foreground/50">{label}</dt>
      <dd className="text-right text-foreground/90">{value}</dd>
    </div>
  );
}
