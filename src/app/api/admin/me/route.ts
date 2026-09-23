import { NextResponse } from "next/server";

import { getSession, isOwner } from "@/lib/dal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** `GET /api/admin/me` — papel do usuário logado (para gating de navegação no cliente). */
export async function GET() {
  const session = await getSession();
  const user = session?.user as { role?: string; name?: string } | undefined;
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  // Default retrocompatível: alinhado ao `verifySession` da DAL (role legado ausente = ADMIN/owner).
  // Manter igual à DAL evita esconder/permitir a mesma aba de forma inconsistente.
  const role = user.role ?? "ADMIN";
  return NextResponse.json({ role, owner: isOwner(role), name: user.name ?? "" });
}
