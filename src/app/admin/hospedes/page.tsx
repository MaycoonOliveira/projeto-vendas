import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { listGuests } from "@/lib/services/reservation-admin";

export const metadata: Metadata = { title: "Hóspedes" };

export default async function HospedesPage() {
  await requireAdmin();
  const guests = await listGuests();

  return (
    <AdminShell>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Hóspedes</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Contatos coletados nas reservas (dados mínimos — LGPD). Acesso restrito ao painel.
      </p>

      {guests.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/50">Nenhum hóspede cadastrado ainda.</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Reservas</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground/80">{g.fullName}</td>
                  <td className="px-4 py-3 text-foreground/70">{g.email}</td>
                  <td className="px-4 py-3 text-foreground/70">{g.phone}</td>
                  <td className="px-4 py-3 text-foreground/60">{g.reservations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
