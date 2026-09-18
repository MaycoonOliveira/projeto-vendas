/** Rótulos/estilos de status de reserva (compartilhado entre painel e página pública). */
export const RESERVATION_STATUS_LABEL: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: "Pendente", className: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "Confirmada", className: "bg-green-50 text-green-700" },
  CHECKED_IN: { label: "Hospedado", className: "bg-emerald-100 text-emerald-800" },
  CHECKED_OUT: { label: "Check-out", className: "bg-blue-50 text-blue-700" },
  CANCELLED: { label: "Cancelada", className: "bg-red-50 text-red-700" },
  EXPIRED: { label: "Expirada", className: "bg-neutral-100 text-neutral-600" },
  COMPLETED: { label: "Concluída", className: "bg-blue-50 text-blue-700" },
  NO_SHOW: { label: "Não compareceu", className: "bg-red-50 text-red-700" },
};

/** Status efetivo para exibição: um hold PENDING vencido aparece como EXPIRED. */
export function effectiveStatus(
  status: string,
  holdExpiresAt: Date | null,
): string {
  if (
    status === "PENDING" &&
    holdExpiresAt != null &&
    holdExpiresAt.getTime() < Date.now()
  ) {
    return "EXPIRED";
  }
  return status;
}
