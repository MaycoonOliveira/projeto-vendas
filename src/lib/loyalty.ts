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

/** Estadias que faltam para o próximo nível (null se já é o topo). */
export function staysToNextTier(staysCount: number): { tier: LoyaltyTier; missing: number } | null {
  const current = loyaltyTier(staysCount);
  if (current.key === "GOLD") return null;
  const higher = [...TIERS].reverse().find((t) => t.minStays > staysCount);
  if (!higher) return null;
  return { tier: higher, missing: higher.minStays - staysCount };
}
