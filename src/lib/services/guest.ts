import { desc, eq, inArray, sql, type InferSelectModel } from "drizzle-orm";

import { db } from "@/db";
import {
  accommodation,
  auditLog,
  guest,
  GUEST_MESSAGE_CHANNELS,
  GUEST_MESSAGE_DIRECTIONS,
  guestMessage,
  GUEST_STATUSES,
  payment,
  reservation,
} from "@/db/schema";
import { loyaltyTier, type LoyaltyTier } from "@/lib/loyalty";

export type Guest = InferSelectModel<typeof guest>;
export type GuestMessage = InferSelectModel<typeof guestMessage>;

const REVENUE_STATUSES = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED"] as const;

export type GuestStay = {
  id: string;
  publicCode: string;
  status: string;
  checkIn: string;
  checkOut: string;
  totalPriceCents: number;
  accommodationName: string;
};

export type GuestProfile = {
  guest: Guest;
  stays: GuestStay[];
  staysCount: number;
  totalSpentCents: number;
  avgTicketCents: number;
  tier: LoyaltyTier;
  messages: GuestMessage[];
};

export async function getGuestProfile(id: string): Promise<GuestProfile | null> {
  const [g] = await db.select().from(guest).where(eq(guest.id, id)).limit(1);
  if (!g) return null;

  const stays = await db
    .select({
      id: reservation.id,
      publicCode: reservation.publicCode,
      status: reservation.status,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      totalPriceCents: reservation.totalPriceCents,
      accommodationName: accommodation.name,
    })
    .from(reservation)
    .innerJoin(accommodation, eq(accommodation.id, reservation.accommodationId))
    .where(eq(reservation.guestId, id))
    .orderBy(desc(reservation.checkIn));

  const realStays = stays.filter((s) =>
    (REVENUE_STATUSES as readonly string[]).includes(s.status),
  );
  const staysCount = realStays.length;
  const confirmedRevenue = realStays.reduce((sum, s) => sum + s.totalPriceCents, 0);
  const avgTicketCents = staysCount > 0 ? Math.round(confirmedRevenue / staysCount) : 0;

  // Total efetivamente recebido (pagamentos das reservas do hóspede).
  const paidRows = await db
    .select({ cents: sql<number>`coalesce(sum(${payment.amountCents}), 0)::int` })
    .from(payment)
    .innerJoin(reservation, eq(reservation.id, payment.reservationId))
    .where(eq(reservation.guestId, id));
  const totalSpentCents = paidRows[0]?.cents ?? 0;

  const messages = await listGuestMessages(id);

  return {
    guest: g,
    stays,
    staysCount,
    totalSpentCents,
    avgTicketCents,
    tier: loyaltyTier(staysCount),
    messages,
  };
}

/** Comunicações (mensageria V1) do hóspede, mais recentes primeiro. */
export async function listGuestMessages(guestId: string): Promise<GuestMessage[]> {
  return db
    .select()
    .from(guestMessage)
    .where(eq(guestMessage.guestId, guestId))
    .orderBy(desc(guestMessage.createdAt))
    .limit(100);
}

/** Registra uma comunicação com o hóspede. */
export async function addGuestMessage(input: {
  guestId: string;
  channel: string;
  direction: string;
  body: string;
  adminId?: string | null;
}): Promise<GuestMessage | null> {
  const channel = (GUEST_MESSAGE_CHANNELS as readonly string[]).includes(input.channel)
    ? input.channel
    : "NOTE";
  const direction = (GUEST_MESSAGE_DIRECTIONS as readonly string[]).includes(input.direction)
    ? input.direction
    : "OUT";
  const body = input.body.trim().slice(0, 4000);
  if (!body) return null;

  const [row] = await db
    .insert(guestMessage)
    .values({ guestId: input.guestId, channel, direction, body, createdByAdminId: input.adminId ?? null })
    .returning();
  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: input.adminId ?? null,
    action: "guest.message",
    entityType: "guest",
    entityId: input.guestId,
    metadata: { channel, direction },
  });
  return row;
}

export async function updateGuestCrm(
  id: string,
  patch: {
    documentType?: string | null;
    documentNumber?: string | null;
    birthDate?: string | null;
    notes?: string | null;
  },
  adminId?: string | null,
): Promise<void> {
  const documentType =
    patch.documentType && ["CPF", "PASSPORT", "OTHER"].includes(patch.documentType)
      ? patch.documentType
      : null;
  await db
    .update(guest)
    .set({
      documentType,
      documentNumber: patch.documentNumber?.slice(0, 60) || null,
      birthDate: patch.birthDate || null,
      notes: patch.notes?.slice(0, 2000) ?? null,
      updatedAt: new Date(),
    })
    .where(eq(guest.id, id));
  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: adminId ?? null,
    action: "guest.update",
    entityType: "guest",
    entityId: id,
  });
}

export async function setGuestStatus(
  id: string,
  status: string,
  adminId?: string | null,
): Promise<void> {
  if (!(GUEST_STATUSES as readonly string[]).includes(status)) return;
  await db.update(guest).set({ status, updatedAt: new Date() }).where(eq(guest.id, id));
  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: adminId ?? null,
    action: "guest.status",
    entityType: "guest",
    entityId: id,
    metadata: { status },
  });
}

export type GuestListItem = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  reservations: number;
  stays: number;
};

/** Lista de hóspedes com contagem de reservas, estadias reais + status (CRM). */
export async function listGuestsCrm(q?: string): Promise<GuestListItem[]> {
  const term = q?.trim();
  const rows = await db
    .select({
      id: guest.id,
      fullName: guest.fullName,
      email: guest.email,
      phone: guest.phone,
      status: guest.status,
      reservations: sql<number>`count(${reservation.id})::int`,
      stays: sql<number>`count(${reservation.id}) filter (where ${reservation.status} in ('CONFIRMED','CHECKED_IN','CHECKED_OUT','COMPLETED'))::int`,
    })
    .from(guest)
    .leftJoin(reservation, eq(reservation.guestId, guest.id))
    .where(
      term
        ? sql`(${guest.fullName} ilike ${`%${term}%`} or ${guest.email} ilike ${`%${term}%`} or ${guest.phone} ilike ${`%${term}%`})`
        : undefined,
    )
    .groupBy(guest.id)
    .orderBy(desc(guest.createdAt))
    .limit(300);
  return rows;
}

/** Total gasto por hóspede (para eventual ranking) — evita N+1. */
export async function totalSpentByGuest(guestIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (guestIds.length === 0) return out;
  const rows = await db
    .select({
      guestId: reservation.guestId,
      cents: sql<number>`coalesce(sum(${payment.amountCents}), 0)::int`,
    })
    .from(payment)
    .innerJoin(reservation, eq(reservation.id, payment.reservationId))
    .where(inArray(reservation.guestId, guestIds))
    .groupBy(reservation.guestId);
  for (const r of rows) out.set(r.guestId, r.cents);
  return out;
}
