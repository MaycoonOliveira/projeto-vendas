import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { effectiveStatus, RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import { listReservations } from "@/lib/services/reservation-admin";
import { totalPaidByReservation } from "@/lib/services/payment";
import { paymentStatus, perNightSummary } from "@/lib/payment-status";
import type { ReservationStatus } from "@/db/schema";
import { formatDateBR } from "@/lib/dates";
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
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();
  const { status, q, page } = await searchParams;
  const filter = status && VALID.has(status) ? (status as ReservationStatus) : undefined;
  const pageNum = Math.max(1, Number(page) || 1);
  const { items: reservations, total, pageSize } = await listReservations({
    status: filter,
    q: q?.trim() || undefined,
    page: pageNum,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Agregado de pagamentos da página inteira em UMA query (sem N+1) — FIX 6.
  const paidByRes = await totalPaidByReservation(reservations.map((r) => r.id));

  const qsWith = (over: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (q) sp.set("q", q);
    for (const [k, v] of Object.entries(over)) {
      if (v === undefined || v === "") sp.delete(k);
      else sp.set(k, String(v));
    }
    const s = sp.toString();
    return s ? `/admin/reservas?${s}` : "/admin/reservas";
  };

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

      {/* Busca */}
      <form action="/admin/reservas" method="get" className="mt-5 flex gap-2">
        {status ? <input type="hidden" name="status" value={status} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por hóspede ou código…"
          className="h-10 w-full max-w-sm rounded-lg border border-border bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
        />
        <button type="submit" className="rounded-lg border border-border px-4 text-sm font-medium text-foreground/80 hover:bg-foreground/5">
          Buscar
        </button>
        {q ? (
          <Link href={qsWith({ q: undefined, page: undefined })} className="flex items-center px-2 text-sm text-foreground/50 hover:text-foreground">
            Limpar
          </Link>
        ) : null}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (status ?? "") === f.value;
          const sp = new URLSearchParams();
          if (f.value) sp.set("status", f.value);
          if (q) sp.set("q", q);
          const href = sp.toString() ? `/admin/reservas?${sp}` : "/admin/reservas";
          return (
            <Link
              key={f.value || "all"}
              href={href}
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
        <>
        {/* Mobile: cards empilhados (a tabela abaixo é md+). */}
        <ul className="mt-5 space-y-3 md:hidden">
          {reservations.map((r) => {
            const eff = effectiveStatus(r.status, r.holdExpiresAt);
            const badge = RESERVATION_STATUS_LABEL[eff] ?? RESERVATION_STATUS_LABEL.PENDING;
            const pay = paymentStatus(paidByRes.get(r.id) ?? 0, r.totalPriceCents, eff);
            return (
              <li key={r.id} className="rounded-xl border border-border bg-white p-4">
                <Link
                  href={`/admin/reservas/${r.id}`}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground/90">{r.guestName}</span>
                    <span className="block text-xs text-foreground/50">{r.accommodationName}</span>
                  </div>
                  <span className="font-semibold text-foreground/90">
                    {formatCentsBRL(r.totalPriceCents)}
                  </span>
                </Link>
                <p className="mt-2 text-sm text-foreground/70">
                  {formatDateBR(r.checkIn)} → {formatDateBR(r.checkOut)}
                </p>
                <p className="text-xs text-foreground/45">
                  {perNightSummary(r.totalPriceCents, r.nights)} · até {r.accommodationCapacity} hóspedes
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pay.className}`}>
                    {pay.label}
                  </span>
                  {r.source === "MANUAL" ? (
                    <span className="rounded bg-foreground/5 px-1.5 py-0.5 text-[10px] text-foreground/50">
                      manual
                    </span>
                  ) : null}
                  <Link
                    href={`/admin/reservas/${r.id}`}
                    className="ml-auto font-mono text-[11px] text-primary hover:underline"
                  >
                    {r.publicCode}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Desktop: tabela (md+). */}
        <div className="mt-5 hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Hóspede</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pagamento</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const eff = effectiveStatus(r.status, r.holdExpiresAt);
                const badge = RESERVATION_STATUS_LABEL[eff] ?? RESERVATION_STATUS_LABEL.PENDING;
                const pay = paymentStatus(
                  paidByRes.get(r.id) ?? 0,
                  r.totalPriceCents,
                  eff,
                );
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-foreground/[0.02]"
                  >
                    <td className="px-4 py-3 align-top">
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
                    <td className="px-4 py-3 align-top">
                      <span className="text-foreground/80">{r.guestName}</span>
                      <span className="block text-xs text-foreground/50">
                        {r.accommodationName}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-foreground/70">
                      {formatDateBR(r.checkIn)} → {formatDateBR(r.checkOut)}
                      <span className="block text-xs text-foreground/45">
                        {perNightSummary(r.totalPriceCents, r.nights)} · até{" "}
                        {r.accommodationCapacity} hóspedes
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pay.className}`}>
                        {pay.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top font-medium text-foreground/90">
                      {formatCentsBRL(r.totalPriceCents)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {total > pageSize ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-foreground/50">
            {total} reserva(s) · página {pageNum} de {totalPages}
          </span>
          <div className="flex gap-2">
            {pageNum > 1 ? (
              <Link href={qsWith({ page: pageNum - 1 })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-foreground/5">
                ← Anterior
              </Link>
            ) : null}
            {pageNum < totalPages ? (
              <Link href={qsWith({ page: pageNum + 1 })} className="rounded-lg border border-border px-3 py-1.5 hover:bg-foreground/5">
                Próxima →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
