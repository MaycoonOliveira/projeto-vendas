"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ReserveButton, WhatsappButton } from "@/components/cta";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal só após a montagem (evita divergência de hidratação).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trava a rolagem do body e fecha com Escape quando o drawer está aberto.
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

  // Fundo sólido: em páginas internas sempre; na home apenas após rolar.
  const solid = scrolled || !isHome;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        solid
          ? "border-b border-border bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link
          href="/"
          className={cn(
            "font-display text-xl tracking-tight transition-colors sm:text-2xl",
            solid ? "text-foreground" : "text-white",
          )}
          aria-label={`${siteConfig.name} — página inicial`}
        >
          {siteConfig.name}
        </Link>

        {/* Navegação desktop */}
        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label="Navegação principal"
        >
          {siteConfig.nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition-colors",
                  solid
                    ? "text-foreground/75 hover:text-foreground"
                    : "text-white/80 hover:text-white",
                  active && (solid ? "text-foreground" : "text-white"),
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ReserveButton
            size="sm"
            variant={solid ? "primary" : "light"}
            source="navbar"
          />
        </div>

        {/* Botão do menu mobile */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full transition-colors lg:hidden",
            solid
              ? "text-foreground hover:bg-foreground/5"
              : "text-white hover:bg-white/10",
          )}
        >
          <Menu className="size-6" aria-hidden />
        </button>
      </Container>

      {/* Drawer mobile — renderizado via portal no <body> para escapar do containing-block
          criado pelo backdrop-blur do header (senão o painel fica confinado/transparente). */}
      {mounted
        ? createPortal(
            <div
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              aria-hidden={!open}
              className={cn(
                "fixed inset-0 z-[60] transition-[visibility] lg:hidden",
                open ? "visible" : "invisible",
              )}
            >
              <div
                onClick={() => setOpen(false)}
                className={cn(
                  "absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300",
                  open ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
              <div
                className={cn(
                  "absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-background shadow-[var(--shadow-lift)] transition-transform duration-300 ease-out",
                  open ? "translate-x-0" : "translate-x-full",
                )}
              >
                <div className="flex h-16 items-center justify-between px-6">
                  <span className="font-display text-xl">{siteConfig.name}</span>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Fechar menu"
                    className="inline-flex size-11 items-center justify-center rounded-full text-foreground hover:bg-foreground/5"
                  >
                    <X className="size-6" aria-hidden />
                  </button>
                </div>

                <nav
                  className="flex flex-col gap-1 px-4 py-4"
                  aria-label="Navegação mobile"
                >
                  {siteConfig.nav.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-xl px-4 py-3 text-lg font-medium transition-colors",
                          active
                            ? "bg-muted text-foreground"
                            : "text-foreground/80 hover:bg-muted",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-auto flex flex-col gap-3 border-t border-border px-6 py-6">
                  <ReserveButton className="w-full" source="mobile-menu" />
                  <WhatsappButton className="w-full" source="mobile-menu" />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
