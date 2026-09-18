import { desc, eq, inArray, ne, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLog, user } from "@/db/schema";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export const TEAM_ROLES = ["OWNER", "STAFF"] as const;

/** Papéis com poderes de proprietário (inclui o legado ADMIN). */
const OWNER_ROLES = ["OWNER", "ADMIN"];

export async function listUsers(): Promise<TeamMember[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
    .from(user)
    .orderBy(desc(user.role), user.name);
}

/** Nº de proprietários ativos — usado para não deixar a pousada sem OWNER. */
async function activeOwnerCount(excludeUserId?: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(user)
    .where(
      excludeUserId
        ? sql`${user.isActive} = true AND ${inArray(user.role, OWNER_ROLES)} AND ${ne(user.id, excludeUserId)}`
        : sql`${user.isActive} = true AND ${inArray(user.role, OWNER_ROLES)}`,
    );
  return rows[0]?.n ?? 0;
}

export type TeamError = "LAST_OWNER" | "INVALID" | "EMAIL_TAKEN";

/** Altera o papel de um usuário (OWNER/STAFF). Protege contra remover o último proprietário. */
export async function setUserRole(
  id: string,
  role: string,
  actorId?: string | null,
): Promise<{ ok: true } | { ok: false; error: TeamError }> {
  if (!(TEAM_ROLES as readonly string[]).includes(role)) return { ok: false, error: "INVALID" };

  // Se está rebaixando um OWNER para STAFF, garante que sobra ao menos 1 owner.
  if (role === "STAFF" && (await activeOwnerCount(id)) === 0) {
    return { ok: false, error: "LAST_OWNER" };
  }

  await db.update(user).set({ role }).where(eq(user.id, id));
  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: actorId ?? null,
    action: "user.set_role",
    entityType: "user",
    entityId: id,
    metadata: { role },
  });
  return { ok: true };
}

export async function setUserActive(
  id: string,
  isActive: boolean,
  actorId?: string | null,
): Promise<{ ok: true } | { ok: false; error: TeamError }> {
  if (!isActive && (await activeOwnerCount(id)) === 0) {
    // Desativar deixaria a pousada sem owner ativo.
    return { ok: false, error: "LAST_OWNER" };
  }
  await db.update(user).set({ isActive }).where(eq(user.id, id));
  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: actorId ?? null,
    action: isActive ? "user.activate" : "user.deactivate",
    entityType: "user",
    entityId: id,
  });
  return { ok: true };
}

/**
 * Cria um usuário da equipe (padrão STAFF) com e-mail+senha. Usa o adapter interno do Better Auth
 * (mesmo caminho do seed). O usuário deve trocar a senha depois (fluxo de reset).
 */
export async function createTeamUser(
  input: { name: string; email: string; password: string; role?: string },
  actorId?: string | null,
): Promise<{ ok: true; id: string } | { ok: false; error: TeamError }> {
  const email = input.email.trim().toLowerCase();
  const role = input.role === "OWNER" ? "OWNER" : "STAFF";
  if (!email || input.password.length < 12) return { ok: false, error: "INVALID" };

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (existing[0]) return { ok: false, error: "EMAIL_TAKEN" };

  const ctx = await auth.$context;
  const ia = ctx.internalAdapter as unknown as {
    createUser: (data: Record<string, unknown>) => Promise<{ id: string }>;
    createAccount: (data: Record<string, unknown>) => Promise<unknown>;
  };
  const created = await ia.createUser({
    name: input.name.trim() || email,
    email,
    emailVerified: false,
    role,
    isActive: true,
  });
  const hash = await ctx.password.hash(input.password);
  await ia.createAccount({
    userId: created.id,
    providerId: "credential",
    accountId: created.id,
    password: hash,
  });

  await db.insert(auditLog).values({
    actorType: "USER",
    actorId: actorId ?? null,
    action: "user.create",
    entityType: "user",
    entityId: created.id,
    metadata: { role },
  });
  return { ok: true, id: created.id };
}
