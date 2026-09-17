import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { getSettingsMap } from "@/lib/services/setting";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const values = await getSettingsMap();

  return (
    <AdminShell>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Configurações</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Parâmetros operacionais da pousada.
      </p>
      <div className="mt-6 max-w-2xl rounded-xl border border-border bg-white p-6">
        <SettingsForm values={values} />
      </div>
    </AdminShell>
  );
}
