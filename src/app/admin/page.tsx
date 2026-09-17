import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { listAccommodations } from "@/lib/services/accommodation";
import {
  reservationStatsByStatus,
  upcomingArrivals,
} from "@/lib/services/reservation-admin";
import { formatCentsBRL } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const [accommodations, stats, arrivals] = await Promise.all([
    listAccommodations(),
    reservationStatsByStatus(),
    upcomingArrivals(6),
  ]);
  const active = accommodations.filter((a) => a.isActive).length;

  const cards = [
    { label: "Pendentes", value: stats.PENDING ?? 0, href: "/admin/reservas?status=PENDING" },
    { label: "Confirmadas", value: stats.CONFIRMED ?? 0, href: "/admin/reservas?status=CONFIRMED" },
    { label: "Canceladas", value: stats.CANCELLED ?? 0, href: "/admin/reservas?status=CANCELLED" },
    { label: "Acomodações ativas", value: active, href: "/admin/acomodacoes" },
  ];

  return (
    <AdminShell>
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Bem-vindo, {session.name}
      </h1>
      <p className="mt-2 text-sm text-foreground/60">Painel administrativo da Casa Carram.</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-border bg-white p-4 transition-colors hover:border-primary/40"
          >
            <dt className="text-xs uppercase tracking-wide text-foreground/50">{c.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-foreground">{c.value}</dd>
          </Link>
        ))}
      </dl>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-foreground">Próximas chegadas</h2>
          <Link href="/admin/reservas" className="text-sm font-medium text-primary hover:underline">
            Ver todas →
          </Link>
        </div>

        {arrivals.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/50">Nenhuma chegada confirmada à frente.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                  <th className="px-4 py-3 font-medium">Check-in</th>
                  <th className="px-4 py-3 font-medium">Hóspede</th>
                  <th className="px-4 py-3 font-medium">Noites</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {arrivals.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/reservas/${a.id}`} className="text-primary hover:underline">
                        {a.checkIn}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{a.guestName}</td>
                    <td className="px-4 py-3 text-foreground/70">{a.nights}</td>
                    <td className="px-4 py-3 text-foreground/70">{formatCentsBRL(a.totalPriceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
