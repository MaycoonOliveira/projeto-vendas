import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sql } from "drizzle-orm";

import { db } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/health` — verificação de saúde do ambiente (dev/prod).
 *
 * Padrão: rápido, SEM tocar o banco (sempre responde) — bom para smoke test de deploy.
 * `?deep=1`: também faz um `SELECT 1` para confirmar a conexão com o banco daquele ambiente.
 */
export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get("deep") === "1";

  const body: Record<string, unknown> = {
    ok: true,
    env: process.env.NODE_ENV ?? "unknown",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    time: new Date().toISOString(),
  };

  if (deep) {
    try {
      await db.execute(sql`select 1`);
      body.db = "ok";
    } catch (error) {
      console.error("[health] db check falhou:", error);
      return NextResponse.json({ ...body, ok: false, db: "error" }, { status: 503 });
    }
  }

  return NextResponse.json(body);
}
