import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { findAvailableAccommodations } from "@/lib/services/availability";
import { photosByAccommodation } from "@/lib/services/accommodation-photo";
import { AvailabilityQuerySchema } from "@/lib/validation/availability";

// Consulta dinâmica (lê o banco e o IP do request) — nunca cacheada. Runtime Node (driver pg).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/disponibilidade?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&guests=N`
 *
 * Pública. Retorna as acomodações disponíveis no período com o **total calculado no servidor**.
 * DTO com allowlist de campos (sem vazar linha interna). Rate limit por IP (best-effort).
 * Erros: 400 (query inválida), 429 (rate limit).
 */
export async function GET(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`disponibilidade:${ip}`, 60, 60);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const { searchParams } = request.nextUrl;
  const parsed = AvailabilityQuerySchema.safeParse({
    checkin: searchParams.get("checkin") ?? "",
    checkout: searchParams.get("checkout") ?? "",
    guests: searchParams.get("guests") ?? "",
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Parâmetros inválidos.", field: first?.path?.[0] },
      { status: 400 },
    );
  }

  const { checkin, checkout, guests } = parsed.data;
  let available;
  try {
    available = await findAvailableAccommodations({
      checkIn: checkin,
      checkOut: checkout,
      guests,
    });
  } catch (error) {
    // Erro genérico ao cliente (sem vazar stack/SQL); log detalhado no servidor.
    console.error("[disponibilidade] falha na consulta:", error);
    return NextResponse.json(
      { error: "Não foi possível consultar a disponibilidade. Tente novamente." },
      { status: 503 },
    );
  }

  const photosMap = await photosByAccommodation(available.map((a) => a.accommodation.id));

  return NextResponse.json({
    query: { checkin, checkout, guests },
    count: available.length,
    results: available.map(({ accommodation: acc, price }) => ({
      id: acc.id,
      slug: acc.slug,
      name: acc.name,
      description: acc.description,
      capacity: acc.capacity,
      minNights: acc.minNights,
      photos: (photosMap.get(acc.id) ?? []).map((p) => ({ url: p.url, alt: p.alt })),
      price: {
        nights: price.nights,
        totalCents: price.totalCents,
        currency: price.currency,
      },
    })),
  });
}
