import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/dal";
import { listAccommodations } from "@/lib/services/accommodation";
import { cn, formatCentsBRL } from "@/lib/utils";

export const metadata: Metadata = { title: "Acomodações" };

export default async function AccommodationsPage() {
  await requireAdmin();
  const accommodations = await listAccommodations();

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Acomodações
        </h1>
        <Link
          href="/admin/acomodacoes/nova"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Nova acomodação
        </Link>
      </div>

      {accommodations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm text-foreground/60">
            Nenhuma acomodação cadastrada ainda.
          </p>
          <Link
            href="/admin/acomodacoes/nova"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Cadastrar a primeira →
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Capacidade</th>
                <th className="px-4 py-3 font-medium">Preço base</th>
                <th className="px-4 py-3 font-medium">Mín.</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {accommodations.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{a.name}</div>
                    <div className="text-xs text-foreground/50">/{a.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{a.capacity}</td>
                  <td className="px-4 py-3 text-foreground/80">
                    {formatCentsBRL(a.basePriceCents)}
                  </td>
                  <td className="px-4 py-3 text-foreground/80">{a.minNights}</td>
                  <td className="px-4 py-3">
                    {a.isActive ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        Ativa
                      </span>
                    ) : (
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/60">
                        Inativa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/acomodacoes/${a.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
