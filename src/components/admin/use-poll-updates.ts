"use client";

import { useEffect, useRef } from "react";

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
 * dispara um toast com botão de recarregar. Também avisa o sino para atualizar o badge.
 *
 * Para o polling quando a aba vai para segundo plano (visibilitychange) e retoma ao voltar.
 */
export function usePollUpdates() {
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
            toast("Nova reserva recebida!", "info", {
              label: "Recarregar",
              onClick: () => window.location.reload(),
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
  }, []);
}
