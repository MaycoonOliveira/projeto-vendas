import { describe, expect, it } from "vitest";

import { paymentStatus, perNightSummary } from "@/lib/payment-status";

describe("paymentStatus", () => {
  it("marca Pendente quando nada foi pago", () => {
    const s = paymentStatus(0, 120000, "CONFIRMED");
    expect(s.tone).toBe("pending");
    expect(s.label).toBe("Pendente");
  });

  it("marca Parcial quando 0 < pago < total", () => {
    const s = paymentStatus(50000, 120000, "CONFIRMED");
    expect(s.tone).toBe("partial");
    expect(s.label).toContain("Parcial");
    expect(s.label).toContain("500,00");
  });

  it("marca Pago quando pago >= total", () => {
    const s = paymentStatus(120000, 120000, "CHECKED_OUT");
    expect(s.tone).toBe("paid");
    expect(s.label).toContain("Pago");
  });

  it("mostra — para reservas canceladas ou no-show", () => {
    expect(paymentStatus(0, 120000, "CANCELLED").label).toBe("—");
    expect(paymentStatus(50000, 120000, "NO_SHOW").label).toBe("—");
  });
});

// formatCentsBRL usa espaço não-quebrável (Intl pt-BR); normaliza p/ comparar.
const norm = (s: string) => s.replace(/ /g, " ");

describe("perNightSummary", () => {
  it("calcula o preço por noite (total ÷ noites)", () => {
    expect(norm(perNightSummary(120000, 2))).toBe("2 noites (R$ 600,00/noite)");
  });

  it("usa singular para 1 noite", () => {
    expect(norm(perNightSummary(50000, 1))).toBe("1 noite (R$ 500,00/noite)");
  });

  it("não divide por zero", () => {
    expect(norm(perNightSummary(50000, 0))).toContain("R$ 500,00/noite");
  });
});
