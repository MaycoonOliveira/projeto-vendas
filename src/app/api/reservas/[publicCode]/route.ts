import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isValidPublicCode } from "@/lib/reservation-code";
import {
  getReservationByPublicCode,
  isExpiredHold,
} from "@/lib/services/reservation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/reservas/{publicCode}` — pública por **capability** (código aleatório ~128 bits).
 * Retorna o MÍNIMO (DTO com allowlist): nunca e-mail/telefone/observações/id interno. 404 genérico.
 * `expire-on-read`: um hold PENDING vencido é apresentado como EXPIRED.
 */
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ publicCode: string }> },
) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`reserva-get:${ip}`, 30, 60);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const { publicCode } = await ctx.params;
  if (!isValidPublicCode(publicCode)) {
    return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
  }

  const found = await getReservationByPublicCode(publicCode);
  if (!found) {
    return NextResponse.json({ error: "Reserva não encontrada." }, { status: 404 });
  }

  const { reservation: r, guest, accommodationName } = found;
  const status = isExpiredHold(r) ? "EXPIRED" : r.status;

  return NextResponse.json({
    publicCode: r.publicCode,
    status,
    accommodation: accommodationName,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    guestsCount: r.guestsCount,
    totalCents: r.totalPriceCents,
    currency: r.currency,
    holdExpiresAt: status === "PENDING" ? r.holdExpiresAt : null,
    guestFirstName: guest?.fullName?.trim().split(/\s+/)[0] ?? null,
  });
}
