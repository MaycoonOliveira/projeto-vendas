import { describe, expect, it } from "vitest";

import { calculatePrice } from "@/lib/pricing";

const BASE = 50_000; // R$ 500,00

describe("calculatePrice — sem overrides", () => {
  it("1 noite = preço base", () => {
    const r = calculatePrice({
      checkIn: "2026-10-10",
      checkOut: "2026-10-11",
      basePriceCents: BASE,
      overrides: [],
    });
    expect(r.nights).toBe(1);
    expect(r.totalCents).toBe(50_000);
    expect(r.breakdown).toEqual([{ date: "2026-10-10", priceCents: 50_000 }]);
  });

  it("2 noites = 2x base", () => {
    const r = calculatePrice({
      checkIn: "2026-10-10",
      checkOut: "2026-10-12",
      basePriceCents: BASE,
      overrides: [],
    });
    expect(r.nights).toBe(2);
    expect(r.totalCents).toBe(100_000);
    expect(r.breakdown.map((b) => b.date)).toEqual([
      "2026-10-10",
      "2026-10-11",
    ]);
  });
});

describe("calculatePrice — com overrides", () => {
  it("aplica override apenas às noites cobertas (limites inclusivos)", () => {
    // Override cobre 11..13 (inclusive). Estadia 10→14 = noites 10,11,12,13.
    const r = calculatePrice({
      checkIn: "2026-10-10",
      checkOut: "2026-10-14",
      basePriceCents: BASE,
      overrides: [
        { startDate: "2026-10-11", endDate: "2026-10-13", priceCents: 80_000 },
      ],
    });
    expect(r.nights).toBe(4);
    expect(r.breakdown).toEqual([
      { date: "2026-10-10", priceCents: 50_000 },
      { date: "2026-10-11", priceCents: 80_000 },
      { date: "2026-10-12", priceCents: 80_000 },
      { date: "2026-10-13", priceCents: 80_000 },
    ]);
    expect(r.totalCents).toBe(50_000 + 80_000 * 3);
  });

  it("check-out no primeiro dia do override não é cobrado (semiaberto)", () => {
    // Estadia 10→11 (só noite 10). Override começa em 11 → não afeta.
    const r = calculatePrice({
      checkIn: "2026-10-10",
      checkOut: "2026-10-11",
      basePriceCents: BASE,
      overrides: [
        { startDate: "2026-10-11", endDate: "2026-10-20", priceCents: 90_000 },
      ],
    });
    expect(r.totalCents).toBe(50_000);
  });

  it("moeda é sempre BRL", () => {
    const r = calculatePrice({
      checkIn: "2026-10-10",
      checkOut: "2026-10-11",
      basePriceCents: BASE,
      overrides: [],
    });
    expect(r.currency).toBe("BRL");
  });
});
