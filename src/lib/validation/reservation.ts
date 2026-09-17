import { z } from "zod";

import { isISODate, isPastDate, nightsBetween } from "@/lib/dates";
import { MAX_NIGHTS } from "@/lib/validation/availability";

/**
 * Validação do corpo de `POST /api/reservas` (público). Preço e disponibilidade **não** vêm do
 * cliente — são recalculados/revalidados no servidor. Aqui só validamos forma e regras de data.
 */
export const ReservationCreateSchema = z
  .object({
    accommodationId: z.string().uuid("Acomodação inválida."),
    checkin: z.string().refine(isISODate, "Data de check-in inválida."),
    checkout: z.string().refine(isISODate, "Data de check-out inválida."),
    guestsCount: z.coerce
      .number()
      .int("Número de hóspedes inválido.")
      .min(1, "Informe ao menos 1 hóspede.")
      .max(50, "Número de hóspedes acima do limite."),
    guest: z.object({
      fullName: z
        .string()
        .trim()
        .min(2, "Informe o nome completo.")
        .max(160),
      email: z.string().trim().toLowerCase().email("E-mail inválido.").max(160),
      phone: z
        .string()
        .trim()
        .min(8, "Informe um telefone/WhatsApp válido.")
        .max(30),
      notes: z.string().trim().max(1000).optional(),
    }),
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

export type ReservationCreateInput = z.infer<typeof ReservationCreateSchema>;
