import { and, desc, eq, gt, isNull, lte, sql, type InferSelectModel } from "drizzle-orm";

import { db } from "@/db";
import { accommodation, guest, notification, reservation } from "@/db/schema";
import { todayInSaoPaulo } from "@/lib/dates";

export type Notification = InferSelectModel<typeof notification>;

export type NotificationInput = {
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  link?: string | null;
  /** Se definido, insere só se ainda não existir (avisos derivados do tempo). */
  dedupeKey?: string | null;
};

/**
 * Cria uma notificação. Com `dedupeKey`, usa `ON CONFLICT DO NOTHING` (idempotente) — usado pelos
 * avisos derivados do tempo. Sem `dedupeKey`, sempre insere (eventos únicos).
 * Best-effort: nunca deixa a falha de notificação quebrar a operação de negócio que a disparou.
 */
export async function createNotification(input: NotificationInput): Promise<void> {
  try {
    const query = db.insert(notification).values({
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      link: input.link ?? null,
      dedupeKey: input.dedupeKey ?? null,
    });
    if (input.dedupeKey) {
      await query.onConflictDoNothing({ target: notification.dedupeKey });
    } else {
      await query;
    }
  } catch (error) {
    console.error("[notification] falha ao criar (ignorada):", error);
  }
}

export async function listNotifications(limitN = 30): Promise<Notification[]> {
  return db
    .select()
    .from(notification)
    .orderBy(desc(notification.createdAt))
    .limit(limitN);
}

export async function unreadCount(): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notification)
    .where(isNull(notification.readAt));
  return rows[0]?.n ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(eq(notification.id, id), isNull(notification.readAt)));
}

export async function markAllNotificationsRead(): Promise<void> {
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(isNull(notification.readAt));
}

/**
 * Gera avisos derivados do tempo (sem cron), idempotente por `dedupe_key` (uma vez por dia):
 * - holds expirando nas próximas 12h;
 * - chegadas de hoje (CONFIRMED com check-in hoje);
 * - saídas de hoje (CHECKED_IN com check-out hoje).
 * Chamado ao abrir o centro de notificações.
 */
export async function syncTimeBasedNotifications(): Promise<void> {
  const today = todayInSaoPaulo();

  // Holds expirando (próximas 12h).
  const expiring = await db
    .select({
      id: reservation.id,
      guestName: guest.fullName,
      holdExpiresAt: reservation.holdExpiresAt,
    })
    .from(reservation)
    .innerJoin(guest, eq(guest.id, reservation.guestId))
    .where(
      and(
        eq(reservation.status, "PENDING"),
        gt(reservation.holdExpiresAt, sql`now()`),
        lte(reservation.holdExpiresAt, sql`now() + interval '12 hours'`),
      ),
    )
    .limit(50);

  // Chegadas de hoje (CONFIRMED).
  const arrivals = await db
    .select({
      id: reservation.id,
      guestName: guest.fullName,
      accommodationName: accommodation.name,
    })
    .from(reservation)
    .innerJoin(guest, eq(guest.id, reservation.guestId))
    .innerJoin(accommodation, eq(accommodation.id, reservation.accommodationId))
    .where(and(eq(reservation.status, "CONFIRMED"), eq(reservation.checkIn, today)))
    .limit(50);

  // Saídas de hoje (CHECKED_IN).
  const departures = await db
    .select({
      id: reservation.id,
      guestName: guest.fullName,
      accommodationName: accommodation.name,
    })
    .from(reservation)
    .innerJoin(guest, eq(guest.id, reservation.guestId))
    .innerJoin(accommodation, eq(accommodation.id, reservation.accommodationId))
    .where(and(eq(reservation.status, "CHECKED_IN"), eq(reservation.checkOut, today)))
    .limit(50);

  const jobs: NotificationInput[] = [];
  for (const r of expiring) {
    jobs.push({
      type: "HOLD_EXPIRING",
      title: "Reserva pendente expirando",
      body: `A reserva de ${r.guestName} expira em breve. Confirme ou entre em contato.`,
      entityType: "reservation",
      entityId: r.id,
      link: `/admin/reservas/${r.id}`,
      dedupeKey: `HOLD_EXPIRING:${r.id}:${today}`,
    });
  }
  for (const r of arrivals) {
    jobs.push({
      type: "CHECK_IN_TODAY",
      title: "Chegada hoje",
      body: `${r.guestName} chega hoje (${r.accommodationName}).`,
      entityType: "reservation",
      entityId: r.id,
      link: `/admin/reservas/${r.id}`,
      dedupeKey: `CHECK_IN_TODAY:${r.id}:${today}`,
    });
  }
  for (const r of departures) {
    jobs.push({
      type: "CHECK_OUT_TODAY",
      title: "Saída hoje",
      body: `${r.guestName} faz check-out hoje (${r.accommodationName}).`,
      entityType: "reservation",
      entityId: r.id,
      link: `/admin/reservas/${r.id}`,
      dedupeKey: `CHECK_OUT_TODAY:${r.id}:${today}`,
    });
  }

  await Promise.all(jobs.map((j) => createNotification(j)));
}
