import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isISODate } from "@/lib/dates";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getPropertyAvailability } from "@/lib/services/availability";

// Consulta dinâmica (lê o banco) — nunca cacheada. Runtime Node (driver pg).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/calendario?from=YYYY-MM-DD&to=YYYY-MM-DD`
 *
 * Pública. Disponibilidade agregada da propriedade por noite (calendário visual do site).
 * Retorna apenas `{ date, occupied }` — sem nenhum dado identificável de reserva/hóspede.
 * Janela máxima de ~92 dias (3 meses) por chamada. Rate limit por IP.
 */
export async function GET(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`calendario:${ip}`, 60, 60);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!isISODate(from) || !isISODate(to) || from >= to) {
    return NextResponse.json({ error: "Intervalo inválido." }, { status: 400 });
  }
  // Limite de janela: evita varreduras longas.
  const spanDays = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (spanDays > 92) {
    return NextResponse.json(
      { error: "Intervalo máximo de 3 meses por consulta." },
      { status: 400 },
    );
  }

  try {
    const days = await getPropertyAvailability(from, to);
    return NextResponse.json({ from, to, days });
  } catch (error) {
    console.error("[calendario] falha na consulta:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o calendário. Tente novamente." },
      { status: 503 },
    );
  }
}
