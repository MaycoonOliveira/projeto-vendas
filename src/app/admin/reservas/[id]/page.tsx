import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { effectiveStatus, RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import { getReservationAdmin } from "@/lib/services/reservation-admin";
import { formatCentsBRL } from "@/lib/utils";
import {
  cancelReservationAction,
  completeReservationAction,
  confirmReservationAction,
  noShowReservationAction,
} from "../actions";
import { ReservationEditForm } from "./reservation-edit-form";

export const metadata: Metadata = { title: "Reserva" };

export default async function ReservaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;

  const data = await getReservationAdmin(id);
  if (!data) notFound();

  const { reservation: r, guest, accommodation, history } = data;
  const eff = effectiveStatus(r.status, r.holdExpiresAt);
  const badge = RESERVATION_STATUS_LABEL[eff] ?? RESERVATION_STATUS_LABEL.PENDING;
  const editable = eff === "PENDING" || eff === "CONFIRMED";

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

      {saved ? (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Alterações salvas.</p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Reserva */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Reserva</h2>
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
              <button className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                Confirmar
              </button>
            </form>
          ) : null}
          {eff === "CONFIRMED" ? (
            <>
              <form action={completeReservationAction}>
                <input type="hidden" name="id" value={r.id} />
                <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Concluir
                </button>
              </form>
              <form action={noShowReservationAction}>
                <input type="hidden" name="id" value={r.id} />
                <button className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-foreground/5">
                  Não compareceu
                </button>
              </form>
            </>
          ) : null}
          {eff === "PENDING" || eff === "CONFIRMED" ? (
            <form action={cancelReservationAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input
                name="reason"
                placeholder="Motivo (opcional)"
                className="h-9 rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary"
              />
              <button className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                Cancelar reserva
              </button>
            </form>
          ) : null}
          {!editable ? (
            <p className="text-sm text-foreground/50">
              Reserva em estado terminal — sem ações disponíveis.
            </p>
          ) : null}
        </div>
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
