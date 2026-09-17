import { z } from "zod";

import { isISODate, isPastDate, nightsBetween } from "@/lib/dates";

/**
 * Validação da consulta pública de disponibilidade (`GET /api/disponibilidade`).
 * Regras de fronteira (todas server-side; o cliente nunca é fonte de verdade):
 * - datas ISO válidas; `checkout > checkin`; check-in não pode estar no passado;
 * - janela limitada (máx. `MAX_NIGHTS` noites) para evitar abuso/consultas absurdas.
 */
export const MAX_NIGHTS = 365;
export const MAX_GUESTS = 50;

export const AvailabilityQuerySchema = z
  .object({
    checkin: z.string().refine(isISODate, "Data de check-in inválida."),
    checkout: z.string().refine(isISODate, "Data de check-out inválida."),
    guests: z.coerce
      .number()
      .int("Número de hóspedes inválido.")
      .min(1, "Informe ao menos 1 hóspede.")
      .max(MAX_GUESTS, "Número de hóspedes acima do limite."),
  })
  .refine((d) => nightsBetween(d.checkin, d.checkout) >= 1, {
    message: "O check-out deve ser posterior ao check-in.",
    path: ["checkout"],
  })
  .refine((d) => !isPastDate(d.checkin), {
    message: "A data de check-in não pode estar no passado.",
    path: ["checkin"],
  })
  .refine((d) => nightsBetween(d.checkin, d.checkout) <= MAX_NIGHTS, {
    message: `A estadia excede o máximo de ${MAX_NIGHTS} noites.`,
    path: ["checkout"],
  });

export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;
