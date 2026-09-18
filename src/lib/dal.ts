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

/**
 * RBAC (Fase 19). Papéis: OWNER (proprietário, acesso total) e STAFF (recepção, operação do dia).
 * `ADMIN` é o papel legado dos usuários existentes — tratado como OWNER (retrocompatível).
 */
const STAFF_ROLES = new Set(["ADMIN", "OWNER", "STAFF"]);

export function isOwner(role: string): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** Exige sessão de qualquer membro da equipe (OWNER/STAFF/ADMIN). */
export async function requireAdmin(): Promise<SessionInfo> {
  const session = await verifySession();
  if (!STAFF_ROLES.has(session.role)) {
    redirect("/admin/login");
  }
  return session;
}

/** Exige papel de proprietário (OWNER/ADMIN) — financeiro, configurações, equipe. */
export async function requireOwner(): Promise<SessionInfo> {
  const session = await requireAdmin();
  if (!isOwner(session.role)) {
    redirect("/admin?flash=denied");
  }
  return session;
}
