"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwner } from "@/lib/dal";
import {
  createTeamUser,
  setUserActive,
  setUserRole,
  type TeamError,
} from "@/lib/services/team";

export type FormState = { error?: string; ok?: boolean };

const ERROR_MESSAGE: Record<TeamError, string> = {
  LAST_OWNER: "Não é possível: a pousada ficaria sem proprietário ativo.",
  INVALID: "Dados inválidos (senha com no mínimo 12 caracteres).",
  EMAIL_TAKEN: "Já existe um usuário com esse e-mail.",
};

export async function setRoleAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  const res = id ? await setUserRole(id, role, owner.userId) : { ok: false as const, error: "INVALID" as const };
  revalidatePath("/admin/equipe");
  redirect(`/admin/equipe?flash=${res.ok ? "role_saved" : "team_error"}`);
}

export async function setActiveAction(formData: FormData): Promise<void> {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  const res = id ? await setUserActive(id, active, owner.userId) : { ok: false as const, error: "INVALID" as const };
  revalidatePath("/admin/equipe");
  redirect(`/admin/equipe?flash=${res.ok ? "active_saved" : "team_error"}`);
}

export async function createUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const owner = await requireOwner();
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "STAFF");

  const res = await createTeamUser({ name, email, password, role }, owner.userId);
  if (!res.ok) return { error: ERROR_MESSAGE[res.error] };

  revalidatePath("/admin/equipe");
  return { ok: true };
}
