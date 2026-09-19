"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra de progresso fina no topo (estilo NProgress) para feedback GLOBAL de navegação (FIX 5).
 *
 * Começa ao clicar num link interno ou submeter um formulário (Server Action = navegação), e
 * completa quando a rota efetivamente muda (pathname/searchParams). Cobre a maioria das ações que
 * chamam o backend no App Router (navegações + Server Actions que redirecionam), sem depender de
 * estado manual em cada botão.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inicia ao clicar num link interno ou ao submeter um formulário.
  useEffect(() => {
    function isInternalNav(a: HTMLAnchorElement | null): boolean {
      if (!a || !a.href) return false;
      if (a.target === "_blank" || a.hasAttribute("download")) return false;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      // mesma URL (só hash) não é navegação de página
      if (url.pathname === window.location.pathname && url.hash) return false;
      return true;
    }
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (isInternalNav(a as HTMLAnchorElement | null)) setState("loading");
    }
    function onSubmit() {
      setState("loading");
    }
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("submit", onSubmit, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("submit", onSubmit, { capture: true });
    };
  }, []);

  // Completa quando a rota muda. setState é DEFERIDO (rAF/timeout) para não disparar render
  // em cascata de forma síncrona no corpo do efeito (react-hooks/set-state-in-effect).
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setState((s) => (s === "loading" ? "done" : s)),
    );
    if (doneTimer.current) clearTimeout(doneTimer.current);
    doneTimer.current = setTimeout(() => setState("idle"), 400);
    return () => {
      cancelAnimationFrame(raf);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, [pathname, searchParams]);

  const width = state === "loading" ? "90%" : state === "done" ? "100%" : "0%";
  const opacity = state === "idle" ? 0 : 1;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      style={{ opacity, transition: "opacity 300ms ease" }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
        style={{
          width,
          transition:
            state === "loading"
              ? "width 10s cubic-bezier(0.1,0.7,0.6,1)"
              : "width 250ms ease",
        }}
      />
    </div>
  );
}
