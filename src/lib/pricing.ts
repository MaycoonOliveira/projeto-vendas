import { eachNight } from "./dates";

/**
 * PricingService (puro, server-side). Calcula o total de uma estadia a partir do preço base e
 * dos `rate_override` (não-sobrepostos ⇒ cada noite mapeia a no máx. 1 override). Nunca confia
 * em preço vindo do cliente. Valores em centavos (inteiros).
 *
 * Regras: intervalo `[check_in, check_out)`; a diária do check-out não é cobrada. No V1 o nº de
 * hóspedes não altera o preço (só valida capacidade, feito na borda).
 */
export type RateOverrideInput = {
  startDate: string; // YYYY-MM-DD (inclusivo)
  endDate: string; // YYYY-MM-DD (inclusivo — a tarifa vale para as noites de start..end)
  priceCents: number;
};

export type PriceBreakdownNight = { date: string; priceCents: number };

export type PriceResult = {
  nights: number;
  totalCents: number;
  currency: "BRL";
  breakdown: PriceBreakdownNight[];
};

export type PriceInput = {
  checkIn: string;
  checkOut: string;
  basePriceCents: number;
  overrides: RateOverrideInput[];
};

export function calculatePrice({
  checkIn,
  checkOut,
  basePriceCents,
  overrides,
}: PriceInput): PriceResult {
  const nights = eachNight(checkIn, checkOut);

  const breakdown: PriceBreakdownNight[] = nights.map((date) => {
    // Datas ISO comparam corretamente como string. Overrides são não-sobrepostos → ≤1 match.
    const override = overrides.find(
      (o) => o.startDate <= date && date <= o.endDate,
    );
    return { date, priceCents: override ? override.priceCents : basePriceCents };
  });

  const totalCents = breakdown.reduce((sum, night) => sum + night.priceCents, 0);

  return { nights: nights.length, totalCents, currency: "BRL", breakdown };
}
