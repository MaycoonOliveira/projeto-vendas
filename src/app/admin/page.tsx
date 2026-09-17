import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { listAccommodations } from "@/lib/services/accommodation";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const accommodations = await listAccommodations();
  const active = accommodations.filter((a) => a.isActive).length;

  return (
    <AdminShell>
      <h1 className="font-serif text-2xl font-semibold text-foreground">
        Bem-vindo, {session.name}
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Painel administrativo da Casa Carram. Disponibilidade e reservas chegam
        nas próximas fases.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-foreground/50">
            Acomodações
          </dt>
          <dd className="mt-1 text-2xl font-semibold text-foreground">
            {accommodations.length}
          </dd>
          <p className="text-xs text-foreground/50">{active} ativa(s)</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-foreground/50">
            Papel
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {session.role}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <dt className="text-xs uppercase tracking-wide text-foreground/50">
            E-mail
          </dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {session.email}
          </dd>
        </div>
      </dl>

      <div className="mt-8">
        <Link
          href="/admin/acomodacoes"
          className="text-sm font-medium text-primary hover:underline"
        >
          Gerenciar acomodações →
        </Link>
      </div>
    </AdminShell>
  );
}
