import { toNextJsHandler } from "better-auth/next-js";

import { assertAuthConfigured, auth } from "@/lib/auth";

// Better Auth exige runtime Node (não edge) e é sempre dinâmico.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

// Valida o secret em REQUEST (não em build): mantém o `next build` verde no CI sem env.
export async function GET(request: Request) {
  assertAuthConfigured();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  assertAuthConfigured();
  return handlers.POST(request);
}
