import { describe, expect, it } from "vitest";

import { addDays, todayInSaoPaulo } from "@/lib/dates";
import {
  AvailabilityQuerySchema,
  MAX_NIGHTS,
} from "@/lib/validation/availability";

// Datas relativas a "hoje" (São Paulo) para não depender de calendário fixo.
const today = todayInSaoPaulo();
const future = addDays(today, 30);
const futurePlus2 = addDays(future, 2);

describe("AvailabilityQuerySchema", () => {
  it("aceita uma consulta válida (coerção de guests)", () => {
    const r = AvailabilityQuerySchema.safeParse({
      checkin: future,
      checkout: futurePlus2,
      guests: "2",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.guests).toBe(2);
  });

  it("rejeita check-out ≤ check-in", () => {
    const r = AvailabilityQuerySchema.safeParse({
      checkin: futurePlus2,
      checkout: future,
      guests: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita datas iguais (0 noites)", () => {
    const r = AvailabilityQuerySchema.safeParse({
      checkin: future,
      checkout: future,
      guests: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita check-in no passado", () => {
    const r = AvailabilityQuerySchema.safeParse({
      checkin: addDays(today, -1),
      checkout: addDays(today, 2),
      guests: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita data ISO inválida", () => {
    const r = AvailabilityQuerySchema.safeParse({
      checkin: "2026-02-30",
      checkout: future,
      guests: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita estadia acima do máximo de noites", () => {
    const r = AvailabilityQuerySchema.safeParse({
      checkin: future,
      checkout: addDays(future, MAX_NIGHTS + 1),
      guests: 1,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita guests < 1", () => {
    const r = AvailabilityQuerySchema.safeParse({
      checkin: future,
      checkout: futurePlus2,
      guests: 0,
    });
    expect(r.success).toBe(false);
  });
});
