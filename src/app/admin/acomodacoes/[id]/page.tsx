import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import {
  getAccommodation,
  listOverrides,
} from "@/lib/services/accommodation";
import { formatCentsBRL } from "@/lib/utils";
import { AccommodationForm } from "../accommodation-form";
import {
  deleteAccommodationAction,
  deleteOverrideAction,
  updateAccommodationAction,
} from "../actions";
import { OverrideForm } from "../override-form";

export const metadata: Metadata = { title: "Editar acomodação" };

export default async function EditAccommodationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;

  const accommodation = await getAccommodation(id);
  if (!accommodation) notFound();

  const overrides = await listOverrides(id);

  return (
    <AdminShell>
      <Link
        href="/admin/acomodacoes"
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Acomodações
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">
        {accommodation.name}
      </h1>

      {saved ? (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Alterações salvas.
        </p>
      ) : null}

      <section className="mt-6">
        <AccommodationForm
          action={updateAccommodationAction}
          submitLabel="Salvar alterações"
          values={{
            id: accommodation.id,
            name: accommodation.name,
            slug: accommodation.slug,
            description: accommodation.description ?? "",
            capacity: accommodation.capacity,
            basePriceReais: (accommodation.basePriceCents / 100).toString(),
            minNights: accommodation.minNights,
            isActive: accommodation.isActive,
            sortOrder: accommodation.sortOrder,
          }}
        />
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-semibold text-foreground">
          Tarifas por período
        </h2>
        <p className="mt-1 text-sm text-foreground/60">
          Sobreescrevem o preço base nas noites do período. Períodos não podem se
          sobrepor.
        </p>

        <div className="mt-4 rounded-xl border border-border bg-white p-4">
          <OverrideForm accommodationId={accommodation.id} />
        </div>

        {overrides.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                  <th className="px-4 py-3 font-medium">Período</th>
                  <th className="px-4 py-3 font-medium">Preço/noite</th>
                  <th className="px-4 py-3 font-medium">Rótulo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {overrides.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground/80">
                      {o.startDate} — {o.endDate}
                    </td>
                    <td className="px-4 py-3 text-foreground/80">
                      {formatCentsBRL(o.priceCents)}
                    </td>
                    <td className="px-4 py-3 text-foreground/60">
                      {o.label ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteOverrideAction}>
                        <input type="hidden" name="id" value={o.id} />
                        <input
                          type="hidden"
                          name="accommodationId"
                          value={accommodation.id}
                        />
                        <button
                          type="submit"
                          className="text-sm text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-foreground/50">
            Nenhuma tarifa cadastrada — o preço base é usado em todas as noites.
          </p>
        )}
      </section>

      <section className="mt-12 rounded-xl border border-red-200 bg-red-50/40 p-5">
        <h2 className="text-sm font-semibold text-red-700">Zona de risco</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Excluir remove a acomodação da listagem (exclusão lógica, preserva
          histórico).
        </p>
        <form action={deleteAccommodationAction} className="mt-3">
          <input type="hidden" name="id" value={accommodation.id} />
          <button
            type="submit"
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            Excluir acomodação
          </button>
        </form>
      </section>
    </AdminShell>
  );
}
