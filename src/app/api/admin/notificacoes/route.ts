import { NextResponse } from "next/server";

import { getSession } from "@/lib/dal";
import {
  listNotifications,
  syncTimeBasedNotifications,
  unreadCount,
} from "@/lib/services/notification";

// Lê o banco e a sessão — dinâmico, nunca cacheado. Runtime Node (driver pg).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/admin/notificacoes` — centro de notificações do admin (autenticado).
 * Gera avisos derivados do tempo (idempotente) e devolve a lista + contador de não lidas.
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    await syncTimeBasedNotifications();
    const [items, unread] = await Promise.all([listNotifications(30), unreadCount()]);
    return NextResponse.json({ items, unread });
  } catch (error) {
    console.error("[notificacoes] falha:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as notificações." },
      { status: 503 },
    );
  }
}
