import { asc, eq, inArray, sql, type InferSelectModel } from "drizzle-orm";

import { db } from "@/db";
import { accommodationPhoto, auditLog } from "@/db/schema";

export type AccommodationPhoto = InferSelectModel<typeof accommodationPhoto>;

/** Aceita apenas URLs http(s) (anti-XSS: sem `javascript:`/`data:` etc.). */
export function isValidPhotoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") && url.length <= 2048;
  } catch {
    return false;
  }
}

export async function listPhotos(accommodationId: string): Promise<AccommodationPhoto[]> {
  return db
    .select()
    .from(accommodationPhoto)
    .where(eq(accommodationPhoto.accommodationId, accommodationId))
    .orderBy(asc(accommodationPhoto.sortOrder), asc(accommodationPhoto.createdAt));
}

/** Fotos de várias acomodações de uma vez (evita N+1 no site público). */
export async function photosByAccommodation(
  accommodationIds: string[],
): Promise<Map<string, AccommodationPhoto[]>> {
  const out = new Map<string, AccommodationPhoto[]>();
  if (accommodationIds.length === 0) return out;
  const rows = await db
    .select()
    .from(accommodationPhoto)
    .where(inArray(accommodationPhoto.accommodationId, accommodationIds))
    .orderBy(asc(accommodationPhoto.sortOrder), asc(accommodationPhoto.createdAt));
  for (const row of rows) {
    const list = out.get(row.accommodationId) ?? [];
    list.push(row);
    out.set(row.accommodationId, list);
  }
  return out;
}

export async function addPhoto(input: {
  accommodationId: string;
  url: string;
  alt?: string | null;
  adminId?: string | null;
}): Promise<AccommodationPhoto | null> {
  if (!isValidPhotoUrl(input.url)) return null;

  // Próxima ordem: ao final da lista atual.
  const nextRows = await db
    .select({ n: sql<number>`coalesce(max(${accommodationPhoto.sortOrder}), -1) + 1` })
    .from(accommodationPhoto)
    .where(eq(accommodationPhoto.accommodationId, input.accommodationId));
  const sortOrder = nextRows[0]?.n ?? 0;

  const [row] = await db
    .insert(accommodationPhoto)
    .values({
      accommodationId: input.accommodationId,
      url: input.url,
      alt: input.alt?.slice(0, 300) || null,
      sortOrder,
    })
    .returning();

  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: input.adminId ?? null,
    action: "accommodation.photo_add",
    entityType: "accommodation",
    entityId: input.accommodationId,
    metadata: { photoId: row.id },
  });
  return row;
}

export async function deletePhoto(id: string, adminId?: string | null): Promise<boolean> {
  const [row] = await db
    .delete(accommodationPhoto)
    .where(eq(accommodationPhoto.id, id))
    .returning({ id: accommodationPhoto.id, accommodationId: accommodationPhoto.accommodationId });
  if (row) {
    await db.insert(auditLog).values({
      actorType: "USER",
      actorId: adminId ?? null,
      action: "accommodation.photo_delete",
      entityType: "accommodation",
      entityId: row.accommodationId,
      metadata: { photoId: id },
    });
  }
  return Boolean(row);
}
