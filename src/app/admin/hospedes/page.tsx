import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { listGuestsCrm } from "@/lib/services/guest";
import { loyaltyTier } from "@/lib/loyalty";

export const metadata: Metadata = { title: "Hóspedes" };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  NORMAL: { label: "Normal", className: "bg-muted text-foreground/60" },
  VIP: { label: "VIP", className: "bg-amber-100 text-amber-800" },
  BLACKLIST: { label: "Blacklist", className: "bg-red-100 text-red-700" },
};

export default async function HospedesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const guests = await listGuestsCrm(q);

  return (
    <AdminShell>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Hóspedes</h1>
      <p className="mt-1 text-sm text-foreground/60">
        CRM de hóspedes — histórico, documento, aniversário e status. Acesso restrito (LGPD).
      </p>

      <form method="get" className="mt-5 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome, e-mail ou telefone…"
          className="h-10 w-full max-w-md rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
        />
        <button className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground/80 hover:bg-foreground/5">
          Buscar
        </button>
      </form>

      {guests.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/50">
          {q ? "Nenhum hóspede encontrado." : "Nenhum hóspede cadastrado ainda."}
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Fidelidade</th>
                <th className="px-4 py-3 font-medium">Reservas</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => {
                const badge = STATUS_BADGE[g.status] ?? STATUS_BADGE.NORMAL;
                return (
                  <tr key={g.id} className="border-b border-border last:border-0 hover:bg-foreground/[0.02]">
                    <td className="px-4 py-3 font-medium text-foreground/90">{g.fullName}</td>
                    <td className="px-4 py-3 text-foreground/60">
                      <span className="block">{g.email}</span>
                      <span className="block text-xs text-foreground/45">{g.phone}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const t = loyaltyTier(g.stays);
                        return (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${t.className}`}>
                            {t.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-foreground/60">{g.reservations}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/hospedes/${g.id}`} className="text-sm font-medium text-primary hover:underline">
                        Ver perfil →
                      </Link>
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
