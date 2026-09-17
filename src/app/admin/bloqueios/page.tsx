import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { listAccommodations } from "@/lib/services/accommodation";
import { listBlocks } from "@/lib/services/block";
import { deleteBlockAction } from "./actions";
import { BlockForm } from "./block-form";

export const metadata: Metadata = { title: "Bloqueios" };

export default async function BloqueiosPage() {
  await requireAdmin();
  const [accommodations, blocks] = await Promise.all([
    listAccommodations(),
    listBlocks(),
  ]);
  const active = accommodations.filter((a) => a.isActive);

  return (
    <AdminShell>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Bloqueios</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Retire datas do mercado (manutenção, uso do dono). Bloqueios ocupam o mesmo calendário
        das reservas e não podem se sobrepor.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-white p-5">
        {active.length === 0 ? (
          <p className="text-sm text-foreground/50">Cadastre uma acomodação ativa primeiro.</p>
        ) : (
          <BlockForm accommodations={active.map((a) => ({ id: a.id, name: a.name }))} />
        )}
      </div>

      {blocks.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Acomodação</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground/80">{b.accommodationName}</td>
                  <td className="px-4 py-3 text-foreground/70">
                    {b.startDate} → {b.endDate}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{b.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteBlockAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-sm text-red-600 hover:underline">Remover</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 text-sm text-foreground/50">Nenhum bloqueio cadastrado.</p>
      )}
    </AdminShell>
  );
}
