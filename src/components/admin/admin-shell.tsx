import Link from "next/link";

import { signOutAction } from "@/app/admin/actions";

/**
 * Shell das páginas administrativas AUTENTICADAS (header + navegação + logout).
 * Não usar nas páginas públicas de auth (login/esqueci/redefinir). Cada página faz a sua própria
 * checagem de sessão via DAL (`requireAdmin`).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-serif text-lg font-semibold text-foreground"
            >
              Casa Carram · Admin
            </Link>
            <nav className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:flex">
              {[
                ["/admin", "Painel"],
                ["/admin/reservas", "Reservas"],
                ["/admin/calendario", "Calendário"],
                ["/admin/acomodacoes", "Acomodações"],
                ["/admin/bloqueios", "Bloqueios"],
                ["/admin/hospedes", "Hóspedes"],
                ["/admin/configuracoes", "Config."],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="text-foreground/70 transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
