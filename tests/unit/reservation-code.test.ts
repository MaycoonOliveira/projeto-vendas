import { describe, expect, it } from "vitest";

import {
  generatePublicCode,
  isValidPublicCode,
  PUBLIC_CODE_RE,
} from "@/lib/reservation-code";

describe("generatePublicCode", () => {
  it("gera código de 26 caracteres no alfabeto Crockford", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generatePublicCode();
      expect(code).toHaveLength(26);
      expect(PUBLIC_CODE_RE.test(code)).toBe(true);
      // sem caracteres ambíguos
      expect(/[ILOU]/.test(code)).toBe(false);
    }
  });

  it("gera códigos únicos (sem colisão em 10k)", () => {
    const set = new Set<string>();
    for (let i = 0; i < 10_000; i += 1) set.add(generatePublicCode());
    expect(set.size).toBe(10_000);
  });
});

describe("isValidPublicCode", () => {
  it("aceita um código gerado", () => {
    expect(isValidPublicCode(generatePublicCode())).toBe(true);
  });

  it("rejeita formatos inválidos", () => {
    expect(isValidPublicCode("abc")).toBe(false);
    expect(isValidPublicCode("")).toBe(false);
    expect(isValidPublicCode("I".repeat(26))).toBe(false); // 'I' não pertence ao alfabeto
    expect(isValidPublicCode("A".repeat(25))).toBe(false); // tamanho errado
  });
});
