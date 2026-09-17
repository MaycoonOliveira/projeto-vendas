import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendReservationRequestedEmails } from "@/lib/reservation-emails";
import {
  createReservation,
  ReservationConflictError,
} from "@/lib/services/reservation";
import { getAccommodation } from "@/lib/services/accommodation";
import { ReservationCreateSchema } from "@/lib/validation/reservation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFLICT_STATUS: Record<string, number> = {
  UNAVAILABLE: 409,
  CAPACITY: 422,
  MIN_NIGHTS: 422,
  NOT_FOUND: 404,
};

/**
 * `POST /api/reservas` — pública. Cria um hold PENDENTE (24h). Preço/disponibilidade são
 * recalculados no servidor. Header `Idempotency-Key` opcional (dedupe de duplo clique/retry).
 * Erros: 400 (validação), 404/409/422 (conflito de domínio), 429 (rate limit), 503 (falha DB).
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`reservas:${ip}`, 10, 3600);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas solicitações. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = ReservationCreateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Dados inválidos.", field: first?.path?.join(".") },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const idempotencyKey =
    request.headers.get("Idempotency-Key")?.slice(0, 200) || null;

  let result;
  try {
    result = await createReservation({
      accommodationId: data.accommodationId,
      checkIn: data.checkin,
      checkOut: data.checkout,
      guestsCount: data.guestsCount,
      guest: data.guest,
      source: "WEBSITE",
      idempotencyKey,
      ip,
    });
  } catch (error) {
    if (error instanceof ReservationConflictError) {
      return NextResponse.json(
        { error: error.message, reason: error.reason },
        { status: CONFLICT_STATUS[error.reason] ?? 409 },
      );
    }
    console.error("[reservas] falha ao criar reserva:", error);
    return NextResponse.json(
      { error: "Não foi possível concluir a reserva. Tente novamente." },
      { status: 503 },
    );
  }

  // Side effects pós-commit: e-mails (falha não invalida a reserva).
  if (!result.replay) {
    try {
      const acc = await getAccommodation(result.reservation.accommodationId);
      await sendReservationRequestedEmails({
        reservation: result.reservation,
        guest: result.guest,
        accommodationName: acc?.name ?? "Acomodação",
      });
    } catch (emailError) {
      console.error("[reservas] falha ao enviar e-mails:", emailError);
    }
  }

  const r = result.reservation;
  return NextResponse.json(
    {
      publicCode: r.publicCode,
      status: r.status,
      totalCents: r.totalPriceCents,
      currency: r.currency,
      nights: r.nights,
      holdExpiresAt: r.holdExpiresAt,
    },
    { status: result.replay ? 200 : 201 },
  );
}
