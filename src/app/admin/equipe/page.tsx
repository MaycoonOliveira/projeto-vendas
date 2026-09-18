import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireOwner } from "@/lib/dal";
import { isOwner } from "@/lib/dal";
import { listUsers } from "@/lib/services/team";
import { CreateUserForm } from "./create-user-form";
import { setActiveAction, setRoleAction } from "./actions";

export const metadata: Metadata = { title: "Equipe" };

export default async function EquipePage() {
  const me = await requireOwner();
  const users = await listUsers();

  return (
    <AdminShell>
      <h1 className="font-serif text-2xl font-semibold text-foreground">Equipe</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Controle de acesso (RBAC). <strong>Proprietário</strong> tem acesso total; <strong>Recepção</strong>{" "}
        opera reservas/hóspedes, sem financeiro, configurações ou gestão de equipe.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/50">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === me.userId;
              return (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground/90">
                    {u.name}{self ? <span className="ml-2 text-xs text-foreground/40">(você)</span> : null}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{u.email}</td>
                  <td className="px-4 py-3">
                    <form action={setRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={isOwner(u.role) ? "OWNER" : "STAFF"}
                        className="h-8 rounded-lg border border-foreground/15 bg-white px-2 text-xs outline-none focus-visible:border-primary"
                      >
                        <option value="OWNER">Proprietário</option>
                        <option value="STAFF">Recepção</option>
                      </select>
                      <button className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground/70 hover:bg-foreground/5">
                        Salvar
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.isActive ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-600"}`}>
                      {u.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!self ? (
                      <form action={setActiveAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={(!u.isActive).toString()} />
                        <button className="text-xs text-foreground/60 hover:underline">
                          {u.isActive ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-8 max-w-2xl rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-foreground">Adicionar usuário</h2>
        <p className="mt-1 text-xs text-foreground/50">
          Crie o acesso com uma senha provisória; oriente a pessoa a redefini-la em “Esqueci a senha”.
        </p>
        <div className="mt-4">
          <CreateUserForm />
        </div>
      </section>
    </AdminShell>
  );
}
