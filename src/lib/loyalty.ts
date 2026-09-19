/**
 * Fidelidade (Fase 19) — nível derivado do nº de estadias reais do hóspede.
 *
 * PURO e SEM regra comercial inventada: apenas rotula o hóspede por frequência, para a equipe
 * reconhecer recorrência (ex.: oferecer um mimo a um "Ouro"). Benefícios concretos (descontos,
 * cortesias) são decisão do negócio e entram depois, sem quebrar este cálculo.
 */
export type LoyaltyTier = {
  key: "NEW" | "BRONZE" | "SILVER" | "GOLD";
  label: string;
  className: string;
  minStays: number;
};

const TIERS: LoyaltyTier[] = [
  { key: "GOLD", label: "Ouro", className: "bg-amber-100 text-amber-800", minStays: 6 },
  { key: "SILVER", label: "Prata", className: "bg-neutral-200 text-neutral-700", minStays: 3 },
  { key: "BRONZE", label: "Bronze", className: "bg-orange-100 text-orange-800", minStays: 1 },
  { key: "NEW", label: "Novo", className: "bg-muted text-foreground/60", minStays: 0 },
];

export function loyaltyTier(staysCount: number): LoyaltyTier {
  return TIERS.find((t) => staysCount >= t.minStays) ?? TIERS[TIERS.length - 1];
}

/** Texto do tooltip explicando os limiares (FIX 8). */
export const TIER_TOOLTIP =
  "Bronze: 1 ou mais estadias · Prata: 3+ · Ouro: 6+";

/** Legenda para o rodapé/topo da tabela de hóspedes. */
export const TIER_LEGEND =
  "Nível de fidelidade baseado em reservas com status CHECKED_OUT ou COMPLETED (estadias concluídas).";

/** "N estadia(s)" — sufixo legível ao lado do badge. */
export function staysLabel(staysCount: number): string {
  return `${staysCount} ${staysCount === 1 ? "estadia" : "estadias"}`;
}

/** Estadias que faltam para o próximo nível (null se já é o topo). */
export function staysToNextTier(staysCount: number): { tier: LoyaltyTier; missing: number } | null {
  const current = loyaltyTier(staysCount);
  if (current.key === "GOLD") return null;
  const higher = [...TIERS].reverse().find((t) => t.minStays > staysCount);
  if (!higher) return null;
  return { tier: higher, missing: higher.minStays - staysCount };
}
