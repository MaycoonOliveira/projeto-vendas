import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";

import { db } from "@/db";
import { reservation } from "@/db/schema";
import { getSession } from "@/lib/dal";
import { unreadCount } from "@/lib/services/notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/admin/poll-updates` (FIX 4) — sinal LEVE para o painel detectar novidades sem recarregar.
 *
 * Retorna apenas contadores/ids (SEM PII): total de reservas, id da mais recente e nº de
 * notificações não lidas. O cliente compara com o último check e avisa (toast) quando muda.
 * Autenticado (sessão de equipe); 401 sem sessão.
 */
export async function GET() {
  const session = await getSession();
  const user = session?.user as { id?: string } | undefined;
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const [counts] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reservation);
  const [latest] = await db
    .select({ id: reservation.id })
    .from(reservation)
    .orderBy(desc(reservation.createdAt))
    .limit(1);
  const unread = await unreadCount();

  return NextResponse.json({
    reservationCount: counts?.n ?? 0,
    lastReservationId: latest?.id ?? null,
    unreadNotifications: unread,
  });
}
