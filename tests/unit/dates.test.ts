import { describe, expect, it } from "vitest";

import {
  addDays,
  eachNight,
  isISODate,
  isPastDate,
  nightsBetween,
} from "@/lib/dates";

describe("isISODate", () => {
  it("aceita datas válidas", () => {
    expect(isISODate("2026-10-10")).toBe(true);
    expect(isISODate("2026-02-28")).toBe(true);
  });
  it("rejeita formato inválido e datas inexistentes", () => {
    expect(isISODate("2026-2-8")).toBe(false);
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-13-01")).toBe(false);
    expect(isISODate("10/10/2026")).toBe(false);
  });
});

describe("nightsBetween", () => {
  it("conta noites do intervalo semiaberto [in, out)", () => {
    expect(nightsBetween("2026-10-10", "2026-10-11")).toBe(1);
    expect(nightsBetween("2026-10-10", "2026-10-12")).toBe(2);
    expect(nightsBetween("2026-10-10", "2026-10-10")).toBe(0);
  });
  it("atravessa virada de mês corretamente", () => {
    expect(nightsBetween("2026-10-30", "2026-11-02")).toBe(3);
  });
});

describe("eachNight", () => {
  it("lista as diárias, excluindo o check-out", () => {
    expect(eachNight("2026-10-10", "2026-10-12")).toEqual([
      "2026-10-10",
      "2026-10-11",
    ]);
  });
  it("retorna vazio quando não há noites", () => {
    expect(eachNight("2026-10-10", "2026-10-10")).toEqual([]);
  });
});

describe("addDays", () => {
  it("soma dias atravessando o mês", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("isPastDate", () => {
  it("classifica passado x futuro", () => {
    expect(isPastDate("2000-01-01")).toBe(true);
    expect(isPastDate("2999-01-01")).toBe(false);
  });
});
