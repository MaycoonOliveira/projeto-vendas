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

  // Só campos ENVIADOS são gravados. Abas ocultas (não estão no formulário) preservam o valor
  // salvo — evita apagar configs mapeadas para as próximas fases (ex.: Z-API).
  const submitted = SETTING_FIELDS.filter((f) => formData.has(f.key));

  // Obrigatórios: bloqueia salvar vazio (validação no servidor — não depende de HTML required
  // em aba possivelmente oculta).
  for (const field of submitted) {
    if (field.required && !String(formData.get(field.key) ?? "").trim()) {
      return { error: `O campo "${field.label}" é obrigatório.` };
    }
  }

  for (const field of submitted) {
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
