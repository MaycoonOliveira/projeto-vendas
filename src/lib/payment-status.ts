import { formatCentsBRL } from "./utils";

/**
 * Rótulo do status de pagamento de uma reserva (FIX 6) — puro, usável em server e client.
 *
 * Regras: reservas CANCELLED/NO_SHOW não cobram → "—". Senão: nada pago = Pendente,
 * pago < total = Parcial, pago ≥ total = Pago.
 */
export type PaymentTone = "none" | "pending" | "partial" | "paid";

const TONE_CLASS: Record<PaymentTone, string> = {
  none: "bg-neutral-100 text-neutral-500",
  pending: "bg-amber-50 text-amber-700",
  partial: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-50 text-green-700",
};

export function paymentStatus(
  paidCents: number,
  totalCents: number,
  reservationStatus: string,
): { tone: PaymentTone; label: string; className: string } {
  if (reservationStatus === "CANCELLED" || reservationStatus === "NO_SHOW") {
    return { tone: "none", label: "—", className: TONE_CLASS.none };
  }
  if (paidCents <= 0) {
    return { tone: "pending", label: "Pendente", className: TONE_CLASS.pending };
  }
  if (paidCents < totalCents) {
    return {
      tone: "partial",
      label: `Parcial ${formatCentsBRL(paidCents)}`,
      className: TONE_CLASS.partial,
    };
  }
  return {
    tone: "paid",
    label: `Pago ${formatCentsBRL(paidCents)}`,
    className: TONE_CLASS.paid,
  };
}

/** "X noites (R$ Y/noite)" — Y = total ÷ noites (FIX 2). */
export function perNightSummary(totalCents: number, nights: number): string {
  const per = nights > 0 ? Math.round(totalCents / nights) : totalCents;
  const noun = nights === 1 ? "noite" : "noites";
  return `${nights} ${noun} (${formatCentsBRL(per)}/noite)`;
}
