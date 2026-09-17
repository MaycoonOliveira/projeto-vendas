"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/dal";
import {
  ConflictError,
  createAccommodation,
  createOverride,
  deleteOverride,
  softDeleteAccommodation,
  updateAccommodation,
} from "@/lib/services/accommodation";
import {
  AccommodationFormSchema,
  OverrideFormSchema,
  reaisToCents,
  slugify,
} from "@/lib/validation/accommodation";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages && messages[0]) out[key] = messages[0];
  }
  return out;
}

function parseAccommodationForm(formData: FormData) {
  return AccommodationFormSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    capacity: formData.get("capacity") ?? "",
    basePriceReais: formData.get("basePriceReais") ?? "",
    minNights: formData.get("minNights") ?? "",
    sortOrder: formData.get("sortOrder") ?? "0",
  });
}

export async function createAccommodationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = parseAccommodationForm(formData);
  if (!parsed.success) {
    return { error: "Corrija os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;
  const slug = slugify(data.slug && data.slug.length ? data.slug : data.name);
  if (!slug) {
    return { error: "Corrija os campos destacados.", fieldErrors: { slug: "Slug inválido." } };
  }

  let created;
  try {
    created = await createAccommodation({
      slug,
      name: data.name,
      description: data.description || null,
      capacity: data.capacity,
      basePriceCents: reaisToCents(data.basePriceReais),
      minNights: data.minNights,
      isActive: formData.get("isActive") === "on",
      sortOrder: data.sortOrder ?? 0,
    });
  } catch (error) {
    if (error instanceof ConflictError && error.reason === "SLUG_TAKEN") {
      return { error: "Já existe uma acomodação com esse endereço (slug).", fieldErrors: { slug: "Slug em uso." } };
    }
    throw error;
  }

  await writeAudit({
    actorType: "USER",
    actorId: admin.userId,
    action: "accommodation.create",
    entityType: "accommodation",
    entityId: created.id,
    metadata: { slug: created.slug },
  });

  revalidatePath("/admin/acomodacoes");
  redirect(`/admin/acomodacoes/${created.id}?saved=1`);
}

export async function updateAccommodationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Acomodação inválida." };

  const parsed = parseAccommodationForm(formData);
  if (!parsed.success) {
    return { error: "Corrija os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;
  const slug = slugify(data.slug && data.slug.length ? data.slug : data.name);

  let updated;
  try {
    updated = await updateAccommodation(id, {
      slug,
      name: data.name,
      description: data.description || null,
      capacity: data.capacity,
      basePriceCents: reaisToCents(data.basePriceReais),
      minNights: data.minNights,
      isActive: formData.get("isActive") === "on",
      sortOrder: data.sortOrder ?? 0,
    });
  } catch (error) {
    if (error instanceof ConflictError && error.reason === "SLUG_TAKEN") {
      return { error: "Já existe uma acomodação com esse endereço (slug).", fieldErrors: { slug: "Slug em uso." } };
    }
    throw error;
  }

  if (!updated) redirect("/admin/acomodacoes");

  await writeAudit({
    actorType: "USER",
    actorId: admin.userId,
    action: "accommodation.update",
    entityType: "accommodation",
    entityId: id,
    metadata: { slug },
  });

  revalidatePath("/admin/acomodacoes");
  revalidatePath(`/admin/acomodacoes/${id}`);
  redirect(`/admin/acomodacoes/${id}?saved=1`);
}

export async function deleteAccommodationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/acomodacoes");

  const ok = await softDeleteAccommodation(id);
  if (ok) {
    await writeAudit({
      actorType: "USER",
      actorId: admin.userId,
      action: "accommodation.delete",
      entityType: "accommodation",
      entityId: id,
    });
  }

  revalidatePath("/admin/acomodacoes");
  redirect("/admin/acomodacoes");
}

export async function createOverrideAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const accommodationId = String(formData.get("accommodationId") ?? "");
  if (!accommodationId) return { error: "Acomodação inválida." };

  const parsed = OverrideFormSchema.safeParse({
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    priceReais: formData.get("priceReais") ?? "",
    label: formData.get("label") ?? "",
  });
  if (!parsed.success) {
    return { error: "Corrija os campos destacados.", fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const data = parsed.data;

  let created;
  try {
    created = await createOverride({
      accommodationId,
      startDate: data.startDate,
      endDate: data.endDate,
      priceCents: reaisToCents(data.priceReais),
      label: data.label || null,
    });
  } catch (error) {
    if (error instanceof ConflictError && error.reason === "OVERLAP") {
      return {
        error: "O período conflita com uma tarifa existente para esta acomodação.",
        fieldErrors: { startDate: "Período sobreposto." },
      };
    }
    throw error;
  }

  await writeAudit({
    actorType: "USER",
    actorId: admin.userId,
    action: "rate_override.create",
    entityType: "rate_override",
    entityId: created.id,
    metadata: { accommodationId, startDate: data.startDate, endDate: data.endDate },
  });

  revalidatePath(`/admin/acomodacoes/${accommodationId}`);
  return {};
}

export async function deleteOverrideAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const accommodationId = String(formData.get("accommodationId") ?? "");

  if (id) {
    const ok = await deleteOverride(id);
    if (ok) {
      await writeAudit({
        actorType: "USER",
        actorId: admin.userId,
        action: "rate_override.delete",
        entityType: "rate_override",
        entityId: id,
        metadata: { accommodationId },
      });
    }
  }

  if (accommodationId) revalidatePath(`/admin/acomodacoes/${accommodationId}`);
}
