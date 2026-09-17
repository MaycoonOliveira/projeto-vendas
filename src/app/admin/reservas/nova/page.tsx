import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { listAccommodations } from "@/lib/services/accommodation";
import { ManualReservationForm } from "./manual-reservation-form";

export const metadata: Metadata = { title: "Nova reserva manual" };

export default async function NovaReservaPage() {
  await requireAdmin();
  const accommodations = (await listAccommodations()).filter((a) => a.isActive);

  return (
    <AdminShell>
      <Link href="/admin/reservas" className="text-sm text-foreground/60 hover:text-foreground">
        ← Reservas
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">
        Nova reserva manual
      </h1>

      <div className="mt-6 max-w-2xl rounded-xl border border-border bg-white p-6">
        {accommodations.length === 0 ? (
          <p className="text-sm text-foreground/50">
            Cadastre uma acomodação ativa antes de criar reservas.
          </p>
        ) : (
          <ManualReservationForm
            accommodations={accommodations.map((a) => ({ id: a.id, name: a.name }))}
          />
        )}
      </div>
    </AdminShell>
  );
}
