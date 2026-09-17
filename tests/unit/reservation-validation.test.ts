import { describe, expect, it } from "vitest";

import { addDays, todayInSaoPaulo } from "@/lib/dates";
import { ReservationCreateSchema } from "@/lib/validation/reservation";

const today = todayInSaoPaulo();
const ci = addDays(today, 20);
const co = addDays(today, 23);
const ACC = "438ebfa5-9fd5-4edc-ba5d-ae76699ab95a"; // uuid qualquer válido

const validGuest = {
  fullName: "Maria Silva",
  email: "MARIA@EXEMPLO.com",
  phone: "+55 24 99999-0000",
};

describe("ReservationCreateSchema", () => {
  it("aceita um payload válido e normaliza o e-mail (lowercase)", () => {
    const r = ReservationCreateSchema.safeParse({
      accommodationId: ACC,
      checkin: ci,
      checkout: co,
      guestsCount: 2,
      guest: validGuest,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.guest.email).toBe("maria@exemplo.com");
  });

  it("rejeita accommodationId não-uuid", () => {
    const r = ReservationCreateSchema.safeParse({
      accommodationId: "nao-uuid",
      checkin: ci,
      checkout: co,
      guestsCount: 2,
      guest: validGuest,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita check-in no passado", () => {
    const r = ReservationCreateSchema.safeParse({
      accommodationId: ACC,
      checkin: addDays(today, -1),
      checkout: co,
      guestsCount: 2,
      guest: validGuest,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita checkout <= checkin", () => {
    const r = ReservationCreateSchema.safeParse({
      accommodationId: ACC,
      checkin: co,
      checkout: ci,
      guestsCount: 2,
      guest: validGuest,
    });
    expect(r.success).toBe(false);
  });

  it("rejeita e-mail inválido", () => {
    const r = ReservationCreateSchema.safeParse({
      accommodationId: ACC,
      checkin: ci,
      checkout: co,
      guestsCount: 2,
      guest: { ...validGuest, email: "invalido" },
    });
    expect(r.success).toBe(false);
  });

  it("rejeita guests < 1", () => {
    const r = ReservationCreateSchema.safeParse({
      accommodationId: ACC,
      checkin: ci,
      checkout: co,
      guestsCount: 0,
      guest: validGuest,
    });
    expect(r.success).toBe(false);
  });
});
