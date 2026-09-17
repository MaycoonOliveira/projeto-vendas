import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { effectiveStatus, RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import { listReservations } from "@/lib/services/reservation-admin";
import type { ReservationStatus } from "@/db/schema";
import { formatCentsBRL } from "@/lib/utils";

export const metadata: Metadata = { title: "Reservas" };

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "PENDING", label: "Pendentes" },
  { value: "CONFIRMED", label: "Confirmadas" },
  { value: "CANCELLED", label: "Canceladas" },
  { value: "EXPIRED", label: "Expiradas" },
  { value: "COMPLETED", label: "Concluídas" },
];

const VALID = new Set([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "COMPLETED",
  "NO_SHOW",
]);

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = status && VALID.has(status) ? (status as ReservationStatus) : undefined;
  const reservations = await listReservations(filter ? { status: filter } : undefined);

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Reservas</h1>
        <Link
          href="/admin/reservas/nova"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Nova reserva manual
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          return (
            <Link
              key={f.value || "all"}
              href={f.value ? `/admin/reservas?status=${f.value}` : "/admin/reservas"}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-foreground text-white"
                  : "border border-border text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {reservations.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/50">Nenhuma reserva encontrada.</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Hóspede</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const eff = effectiveStatus(r.status, r.holdExpiresAt);
                const badge = RESERVATION_STATUS_LABEL[eff] ?? RESERVATION_STATUS_LABEL.PENDING;
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-foreground/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/reservas/${r.id}`}
                        className="font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {r.publicCode}
                      </Link>
                      {r.source === "MANUAL" ? (
                        <span className="ml-2 rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] text-foreground/50">
                          manual
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{r.guestName}</td>
                    <td className="px-4 py-3 text-foreground/70">
                      {r.checkIn} → {r.checkOut}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {formatCentsBRL(r.totalPriceCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
