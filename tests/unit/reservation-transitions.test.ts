import { describe, expect, it } from "vitest";

import { canTransition } from "@/lib/services/reservation-admin";

describe("canTransition (máquina de estados da reserva)", () => {
  it("permite as transições válidas", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
    expect(canTransition("PENDING", "EXPIRED")).toBe(true);
    expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
    expect(canTransition("CONFIRMED", "COMPLETED")).toBe(true);
    expect(canTransition("CONFIRMED", "NO_SHOW")).toBe(true);
  });

  it("proíbe transições inválidas", () => {
    expect(canTransition("CONFIRMED", "PENDING")).toBe(false);
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
    expect(canTransition("PENDING", "NO_SHOW")).toBe(false);
    expect(canTransition("EXPIRED", "CONFIRMED")).toBe(false);
  });

  it("estados terminais não têm saída", () => {
    for (const terminal of ["CANCELLED", "EXPIRED", "COMPLETED", "NO_SHOW"] as const) {
      for (const to of ["PENDING", "CONFIRMED", "CANCELLED"] as const) {
        expect(canTransition(terminal, to)).toBe(false);
      }
    }
  });
});
