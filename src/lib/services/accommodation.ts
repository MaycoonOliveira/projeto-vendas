import { and, asc, eq, isNull, type InferSelectModel } from "drizzle-orm";

import { db } from "@/db";
import { accommodation, rateOverride } from "@/db/schema";
import { calculatePrice, type PriceResult } from "@/lib/pricing";

export type Accommodation = InferSelectModel<typeof accommodation>;
export type RateOverride = InferSelectModel<typeof rateOverride>;

/** Conflitos de domínio mapeados de erros do Postgres (para respostas 409 nas Server Actions). */
export class ConflictError extends Error {
  constructor(
    public readonly reason: "SLUG_TAKEN" | "OVERLAP",
    message?: string,
  ) {
    super(message ?? reason);
    this.name = "ConflictError";
  }
}

function pgErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Acomodações
// ---------------------------------------------------------------------------

/** Lista acomodações não-deletadas (admin vê ativas e inativas). */
export function listAccommodations(): Promise<Accommodation[]> {
  return db
    .select()
    .from(accommodation)
    .where(isNull(accommodation.deletedAt))
    .orderBy(asc(accommodation.sortOrder), asc(accommodation.name));
}

export async function getAccommodation(id: string): Promise<Accommodation | null> {
  const rows = await db
    .select()
    .from(accommodation)
    .where(and(eq(accommodation.id, id), isNull(accommodation.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export type CreateAccommodationInput = {
  slug: string;
  name: string;
  description?: string | null;
  capacity: number;
  basePriceCents: number;
  minNights: number;
  isActive: boolean;
  sortOrder?: number;
};

export async function createAccommodation(
  input: CreateAccommodationInput,
): Promise<Accommodation> {
  try {
    const [row] = await db
      .insert(accommodation)
      .values({
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        capacity: input.capacity,
        basePriceCents: input.basePriceCents,
        minNights: input.minNights,
        isActive: input.isActive,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();
    return row;
  } catch (error) {
    if (pgErrorCode(error) === "23505") throw new ConflictError("SLUG_TAKEN");
    throw error;
  }
}

/** Campos editáveis (allowlist explícita — sem mass assignment). */
export type UpdateAccommodationInput = Partial<{
  slug: string;
  name: string;
  description: string | null;
  capacity: number;
  basePriceCents: number;
  minNights: number;
  isActive: boolean;
  sortOrder: number;
}>;

export async function updateAccommodation(
  id: string,
  input: UpdateAccommodationInput,
): Promise<Accommodation | null> {
  try {
    const [row] = await db
      .update(accommodation)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(accommodation.id, id), isNull(accommodation.deletedAt)))
      .returning();
    return row ?? null;
  } catch (error) {
    if (pgErrorCode(error) === "23505") throw new ConflictError("SLUG_TAKEN");
    throw error;
  }
}

/**
 * Soft delete (mantém histórico). Também desativa. TODO (Fase 5): bloquear com 409 quando houver
 * reservas ativas — a tabela `reservation` ainda não existe nesta fase.
 */
export async function softDeleteAccommodation(id: string): Promise<boolean> {
  const [row] = await db
    .update(accommodation)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(and(eq(accommodation.id, id), isNull(accommodation.deletedAt)))
    .returning({ id: accommodation.id });
  return Boolean(row);
}

// ---------------------------------------------------------------------------
// Tarifas (rate_override)
// ---------------------------------------------------------------------------

export function listOverrides(accommodationId: string): Promise<RateOverride[]> {
  return db
    .select()
    .from(rateOverride)
    .where(eq(rateOverride.accommodationId, accommodationId))
    .orderBy(asc(rateOverride.startDate));
}

export type CreateOverrideInput = {
  accommodationId: string;
  startDate: string;
  endDate: string;
  priceCents: number;
  label?: string | null;
};

export async function createOverride(
  input: CreateOverrideInput,
): Promise<RateOverride> {
  try {
    const [row] = await db
      .insert(rateOverride)
      .values({
        accommodationId: input.accommodationId,
        startDate: input.startDate,
        endDate: input.endDate,
        priceCents: input.priceCents,
        label: input.label ?? null,
      })
      .returning();
    return row;
  } catch (error) {
    // 23P01 = exclusion_violation (períodos sobrepostos para a mesma acomodação).
    if (pgErrorCode(error) === "23P01") throw new ConflictError("OVERLAP");
    throw error;
  }
}

export async function deleteOverride(id: string): Promise<boolean> {
  const [row] = await db
    .delete(rateOverride)
    .where(eq(rateOverride.id, id))
    .returning({ id: rateOverride.id });
  return Boolean(row);
}

// ---------------------------------------------------------------------------
// Preço (server-side)
// ---------------------------------------------------------------------------

/** Calcula o preço de uma estadia no servidor (base + overrides). `null` se a acomodação sumiu. */
export async function priceForStay(
  accommodationId: string,
  checkIn: string,
  checkOut: string,
): Promise<{ accommodation: Accommodation; price: PriceResult } | null> {
  const acc = await getAccommodation(accommodationId);
  if (!acc) return null;

  const overrides = await listOverrides(accommodationId);
  const price = calculatePrice({
    checkIn,
    checkOut,
    basePriceCents: acc.basePriceCents,
    overrides: overrides.map((o) => ({
      startDate: o.startDate,
      endDate: o.endDate,
      priceCents: o.priceCents,
    })),
  });

  return { accommodation: acc, price };
}
