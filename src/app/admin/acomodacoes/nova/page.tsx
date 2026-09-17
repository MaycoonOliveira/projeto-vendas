import type { Metadata } from "next";
import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { AccommodationForm } from "../accommodation-form";
import { createAccommodationAction } from "../actions";

export const metadata: Metadata = { title: "Nova acomodação" };

export default async function NewAccommodationPage() {
  await requireAdmin();

  return (
    <AdminShell>
      <Link
        href="/admin/acomodacoes"
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Acomodações
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-semibold text-foreground">
        Nova acomodação
      </h1>
      <div className="mt-6">
        <AccommodationForm
          action={createAccommodationAction}
          submitLabel="Criar acomodação"
        />
      </div>
    </AdminShell>
  );
}
