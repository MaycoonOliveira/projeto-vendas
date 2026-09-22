"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/admin/notificacoes-actions";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

/**
 * Sino de notificações do admin: contador de não lidas + **drawer lateral** (desliza da direita).
 * Dinâmico (recarrega ao abrir e quando o polling avisa) e responsivo (largura cheia no mobile,
 * ~380px no desktop). Fase 9 / ajuste de UX.
 */
export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, startTransition] = useTransition();
  const loadingRef = useRef(false);

  async function load() {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const r = await fetch("/api/admin/notificacoes", { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { items: Item[]; unread: number };
      setItems(d.items ?? []);
      setUnread(d.unread ?? 0);
    } catch {
      // silencioso — o sino é auxiliar
    } finally {
      loadingRef.current = false;
      setLoaded(true);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // `load` só chama setState após o `await` (microtask), não de forma síncrona.
    load();
    // O polling do painel (FIX 4) avisa quando o nº de não lidas muda → recarrega.
    const onRefresh = () => load();
    window.addEventListener("casa-notifications-refresh", onRefresh);
    return () => window.removeEventListener("casa-notifications-refresh", onRefresh);
  }, []);

  // Escape fecha; trava a rolagem do fundo enquanto aberto.
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

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) load(); // atualiza ao abrir
  }

  function markOne(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, readAt: new Date().toISOString() } : i)),
    );
    setUnread((u) => Math.max(0, u - 1));
    startTransition(() => {
      void markNotificationReadAction(id);
    });
  }

  function markAll() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? now })));
    setUnread(0);
    startTransition(() => {
      void markAllNotificationsReadAction();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ""}`}
        aria-expanded={open}
        className="relative inline-flex size-10 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/5"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Notificações"
              aria-hidden={!open}
              className={cn("fixed inset-0 z-[70]", open ? "visible" : "invisible")}
            >
              {/* Backdrop */}
              <div
                onClick={() => setOpen(false)}
                aria-hidden
                className={cn(
                  "absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300",
                  open ? "opacity-100" : "opacity-0",
                )}
              />
              {/* Painel lateral */}
              <div
                className={cn(
                  "absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-[var(--shadow-lift)] transition-transform duration-300 ease-out",
                  open ? "translate-x-0" : "translate-x-full",
                )}
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                  <span className="text-sm font-semibold text-foreground">
                    Notificações{unread > 0 ? ` · ${unread} nova${unread > 1 ? "s" : ""}` : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    {unread > 0 ? (
                      <button
                        type="button"
                        onClick={markAll}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5"
                      >
                        <CheckCheck className="size-3.5" aria-hidden /> Marcar todas
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Fechar notificações"
                      className="inline-flex size-9 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/5"
                    >
                      <X className="size-5" aria-hidden />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain">
                  {!loaded ? (
                    <p className="px-4 py-8 text-center text-sm text-foreground/50">Carregando…</p>
                  ) : items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                      <Bell className="size-8 text-foreground/25" aria-hidden />
                      <p className="text-sm text-foreground/50">Nenhuma notificação.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {items.map((n) => {
                        const unreadItem = !n.readAt;
                        const inner = (
                          <div className={cn("flex gap-2.5 px-4 py-3.5", unreadItem && "bg-primary/5")}>
                            <span
                              className={cn(
                                "mt-1.5 size-2 shrink-0 rounded-full",
                                unreadItem ? "bg-primary" : "bg-transparent",
                              )}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{n.title}</p>
                              {n.body ? (
                                <p className="mt-0.5 text-xs text-foreground/60">{n.body}</p>
                              ) : null}
                              <p className="mt-1 text-[11px] text-foreground/40">{ago(n.createdAt)}</p>
                            </div>
                          </div>
                        );
                        return (
                          <li key={n.id}>
                            {n.link ? (
                              <Link
                                href={n.link}
                                onClick={() => {
                                  markOne(n.id);
                                  setOpen(false);
                                }}
                                className="block transition-colors hover:bg-foreground/[0.03]"
                              >
                                {inner}
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markOne(n.id)}
                                className="block w-full text-left transition-colors hover:bg-foreground/[0.03]"
                              >
                                {inner}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
