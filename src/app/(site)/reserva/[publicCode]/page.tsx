import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { WhatsappButton } from "@/components/cta";
import { isValidPublicCode } from "@/lib/reservation-code";
import {
  getReservationByPublicCode,
  isExpiredHold,
} from "@/lib/services/reservation";
import { formatCentsBRL } from "@/lib/utils";

// Página por capability (código secreto) — nunca indexar; sempre dinâmica (lê o banco).
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Sua reserva",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "Confirmada", className: "bg-green-50 text-green-700" },
  CANCELLED: { label: "Cancelada", className: "bg-red-50 text-red-700" },
  EXPIRED: { label: "Expirada", className: "bg-neutral-100 text-neutral-600" },
  COMPLETED: { label: "Concluída", className: "bg-green-50 text-green-700" },
  NO_SHOW: { label: "Não compareceu", className: "bg-red-50 text-red-700" },
};

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ publicCode: string }>;
}) {
  const { publicCode } = await params;
  if (!isValidPublicCode(publicCode)) notFound();

  const found = await getReservationByPublicCode(publicCode);
  if (!found) notFound();

  const { reservation: r, guest, accommodationName } = found;
  const status = isExpiredHold(r) ? "EXPIRED" : r.status;
  const badge = STATUS_LABEL[status] ?? STATUS_LABEL.PENDING;
  const firstName = guest?.fullName?.trim().split(/\s+/)[0] ?? "";

  return (
    <>
      <PageHeader
        eyebrow="Reserva"
        title={firstName ? `Olá, ${firstName}` : "Sua reserva"}
        description="Guarde este código para acompanhar sua reserva."
      />
      <section className="py-14 sm:py-18">
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-semibold tracking-wider text-foreground">
                {r.publicCode}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>

            <dl className="mt-6 grid gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Acomodação</dt>
                <dd className="text-foreground">{accommodationName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Período</dt>
                <dd className="text-foreground">
                  {r.checkIn} → {r.checkOut} ({r.nights} noite
                  {r.nights > 1 ? "s" : ""})
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hóspedes</dt>
                <dd className="text-foreground">{r.guestsCount}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-medium text-foreground">Total</dt>
                <dd className="font-semibold text-foreground">
                  {formatCentsBRL(r.totalPriceCents)}
                </dd>
              </div>
            </dl>

            {status === "PENDING" ? (
              <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Sua reserva está <strong>pendente</strong>. Vamos confirmar por contato com
                as instruções de pagamento. Ela fica reservada por até 24h.
              </div>
            ) : null}
            {status === "EXPIRED" ? (
              <div className="mt-6 rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600">
                O prazo desta solicitação expirou. Faça uma nova reserva ou fale conosco.
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <WhatsappButton size="md" source="reserva" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
