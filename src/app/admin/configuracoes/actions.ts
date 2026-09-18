"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/lib/dal";
import { SETTING_FIELDS, setSetting } from "@/lib/services/setting";
import { writeAudit } from "@/lib/audit";

export type FormState = { ok?: boolean; error?: string };

export async function saveSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireOwner();

  for (const field of SETTING_FIELDS) {
    const value = String(formData.get(field.key) ?? "").slice(0, 4000);
    await setSetting(field.key, value, admin.userId);
  }

  await writeAudit({
    actorType: "USER",
    actorId: admin.userId,
    action: "setting.update",
    entityType: "setting",
    entityId: null,
  });

  revalidatePath("/admin/configuracoes");
  return { ok: true };
}
