import { z } from "zod";

import { isISODate } from "@/lib/dates";

/** Converte reais (número decimal) para centavos inteiros. */
export function reaisToCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Gera um slug seguro a partir de um texto (minúsculo, sem acentos, hifenizado). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const AccommodationFormSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome (mín. 2 caracteres).").max(120),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  capacity: z.coerce
    .number()
    .int("Capacidade deve ser um número inteiro.")
    .min(1, "Capacidade mínima é 1.")
    .max(50, "Capacidade máxima é 50."),
  basePriceReais: z.coerce
    .number()
    .min(0, "Preço inválido.")
    .max(1_000_000, "Preço muito alto."),
  minNights: z.coerce
    .number()
    .int()
    .min(1, "Estadia mínima é 1 noite.")
    .max(365),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export type AccommodationFormData = z.infer<typeof AccommodationFormSchema>;

export const OverrideFormSchema = z
  .object({
    startDate: z.string().refine(isISODate, "Data inicial inválida."),
    endDate: z.string().refine(isISODate, "Data final inválida."),
    priceReais: z.coerce
      .number()
      .min(0, "Preço inválido.")
      .max(1_000_000, "Preço muito alto."),
    label: z.string().trim().max(120).optional(),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: "A data inicial deve ser menor ou igual à final.",
    path: ["endDate"],
  });

export type OverrideFormData = z.infer<typeof OverrideFormSchema>;
