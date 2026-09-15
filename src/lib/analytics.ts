/**
 * Camada de analytics preparada para eventos futuros.
 *
 * NÃO ativa nenhum tracking por conta própria. `track()` apenas:
 *   1. envia o evento para window.dataLayer, SE um provedor (ex.: GTM/GA4)
 *      já tiver sido instalado externamente;
 *   2. registra em console durante o desenvolvimento.
 *
 * Para ativar de fato, instale o GTM/GA4 e configure os gatilhos usando os
 * mesmos nomes de evento abaixo. Ver docs/seo.md.
 */

export type AnalyticsEvent =
  | "click_reservation"
  | "click_whatsapp"
  | "click_phone"
  | "gallery_open"
  | "accommodation_view";

type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const data = { event, ...payload };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(data);
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", data);
  }
}
