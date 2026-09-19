"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { toast } from "@/components/admin/toaster";

/** Evento que o sino de notificações escuta para recarregar o contador (FIX 4). */
export const NOTIFICATIONS_REFRESH_EVENT = "casa-notifications-refresh";

type Poll = {
  reservationCount: number;
  lastReservationId: string | null;
  unreadNotifications: number;
};

const INTERVAL_MS = 30_000;

/**
 * Polling leve de novidades no painel (FIX 4). A cada 30s (só com a aba VISÍVEL), consulta
 * `/api/admin/poll-updates`. Se surgir uma reserva nova (contador subiu ou o id da última mudou),
 * ATUALIZA a tela SOZINHA via `router.refresh()` (soft refresh do Next: re-busca os dados do
 * servidor e re-renderiza no lugar, SEM recarregar a página e sem perder rolagem/estado do
 * formulário) e mostra um toast informando — o admin NÃO precisa dar reload. Também avisa o sino.
 *
 * Para o polling quando a aba vai para segundo plano (visibilitychange) e retoma ao voltar.
 */
export function usePollUpdates() {
  const router = useRouter();
  const last = useRef<Poll | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/admin/poll-updates", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as Poll;
        const prev = last.current;
        if (prev) {
          const novaReserva =
            data.reservationCount > prev.reservationCount ||
            (data.lastReservationId !== null &&
              data.lastReservationId !== prev.lastReservationId);
          if (novaReserva) {
            // Atualiza a tela ATUAL no lugar (dashboard, lista de reservas, etc.) sem reload.
            router.refresh();
            toast("Nova reserva recebida — tela atualizada.", "info", {
              label: "Ver reservas",
              onClick: () => router.push("/admin/reservas"),
            });
          }
          // Sino: se o nº de não lidas mudou, pede refresh do contador.
          if (data.unreadNotifications !== prev.unreadNotifications) {
            window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
          }
        }
        last.current = data;
      } catch {
        // silencioso — polling é auxiliar
      }
    }

    function start() {
      if (timer.current) return;
      void check(); // check imediato ao (re)ativar
      timer.current = setInterval(check, INTERVAL_MS);
    }
    function stop() {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }
    function onVisibility() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    // Primeira leitura estabelece a baseline (sem toast). Só ativa se a aba estiver visível.
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router]);
}
