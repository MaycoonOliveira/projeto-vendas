"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/admin/notificacoes-actions";

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

/** Sino de notificações do admin: contador de não lidas + dropdown. Fase 9. */
export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      const r = await fetch("/api/admin/notificacoes", { cache: "no-store" });
      if (!r.ok) return;
      const d = (await r.json()) as { items: Item[]; unread: number };
      setItems(d.items ?? []);
      setUnread(d.unread ?? 0);
    } catch {
      // silencioso — o sino é auxiliar
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    // `load` só chama setState após o `await` (microtask), não de forma síncrona.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  // Fecha ao clicar fora ou pressionar Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) load(); // atualiza ao abrir
  }

  function markOne(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, readAt: new Date().toISOString() } : i)));
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
    <div className="relative" ref={ref}>
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

      {open ? (
        <div
          role="dialog"
          aria-label="Notificações"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-white shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">Notificações</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="size-3.5" aria-hidden /> Marcar todas como lidas
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!loaded ? (
              <p className="px-4 py-6 text-center text-sm text-foreground/50">Carregando…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-foreground/50">
                Nenhuma notificação.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const unreadItem = !n.readAt;
                  const inner = (
                    <div className={`flex gap-2 px-4 py-3 ${unreadItem ? "bg-primary/5" : ""}`}>
                      {unreadItem ? (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      ) : (
                        <span className="mt-1.5 size-2 shrink-0" aria-hidden />
                      )}
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
                          className="block hover:bg-foreground/[0.03]"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markOne(n.id)}
                          className="block w-full text-left hover:bg-foreground/[0.03]"
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
      ) : null}
    </div>
  );
}
