"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { signOutAction } from "@/app/admin/actions";
import { NotificationBell } from "@/components/admin/notification-bell";
import { Toaster } from "@/components/admin/toaster";
import { cn } from "@/lib/utils";

/**
 * Shell das páginas administrativas AUTENTICADAS (header + navegação + logout).
 * Client Component por causa do drawer mobile (estado aberto/fechado, scroll-lock, Escape).
 * A checagem de sessão continua em cada página via DAL (`requireAdmin`).
 */
const NAV_ITEMS: [href: string, label: string][] = [
  ["/admin", "Painel"],
  ["/admin/reservas", "Reservas"],
  ["/admin/financeiro", "Financeiro"],
  ["/admin/acomodacoes", "Acomodações"],
  ["/admin/bloqueios", "Bloqueios"],
  ["/admin/hospedes", "Hóspedes"],
  ["/admin/configuracoes", "Configurações"],
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Trava a rolagem e fecha com Escape enquanto o drawer está aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-lg font-semibold text-foreground">
              Casa Carram · Admin
            </Link>
            <nav className="hidden items-center gap-4 text-sm lg:flex" aria-label="Navegação admin">
              {NAV_ITEMS.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    isActive(pathname, href)
                      ? "font-medium text-foreground"
                      : "text-foreground/60",
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <form action={signOutAction} className="hidden sm:block">
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                Sair
              </button>
            </form>
            {/* Botão do menu mobile */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={open}
              aria-controls="admin-mobile-menu"
              className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/5 lg:hidden"
            >
              <Menu className="size-6" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      <div
        id="admin-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu do painel"
        aria-hidden={!open}
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "visible" : "invisible")}
      >
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className={cn(
            "absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute right-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-white shadow-[var(--shadow-lift)] transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-5">
            <span className="font-serif text-base font-semibold">Painel</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="inline-flex size-10 items-center justify-center rounded-full text-foreground hover:bg-foreground/5"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-3 py-3" aria-label="Navegação admin mobile">
            {NAV_ITEMS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-4 py-3 text-base transition-colors",
                  isActive(pathname, href)
                    ? "bg-muted font-medium text-foreground"
                    : "text-foreground/80 hover:bg-muted",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border px-5 py-4">
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full rounded-xl border border-border px-4 py-3 text-left text-base text-foreground/80 hover:bg-muted"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Toaster />
    </div>
  );
}
