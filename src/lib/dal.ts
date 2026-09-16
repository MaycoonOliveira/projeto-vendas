import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

/**
 * Data Access Layer (Next 16) — autorização REAL (checagem no DB), próxima da operação.
 * `proxy.ts` faz apenas a checagem otimista (cookie). Aqui é a fonte de verdade.
 *
 * `server-only`: nunca importável por Client Component. Memoizado com `cache()` para não
 * repetir a consulta de sessão no mesmo render.
 */
export type SessionInfo = {
  userId: string;
  role: string;
  email: string;
  name: string;
};

/** Sessão bruta (ou null). Memoizada por render. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Exige sessão válida de admin ativo; redireciona ao login caso contrário. Retorna DTO mínimo. */
export const verifySession = cache(async (): Promise<SessionInfo> => {
  const data = await getSession();
  const user = data?.user as
    | { id: string; email: string; name: string; role?: string; isActive?: boolean }
    | undefined;

  if (!user || user.isActive === false) {
    redirect("/admin/login");
  }

  return {
    userId: user.id,
    role: user.role ?? "ADMIN",
    email: user.email,
    name: user.name,
  };
});

/** Igual a verifySession, mas também exige papel ADMIN (base p/ RBAC no V2). */
export async function requireAdmin(): Promise<SessionInfo> {
  const session = await verifySession();
  if (session.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session;
}
