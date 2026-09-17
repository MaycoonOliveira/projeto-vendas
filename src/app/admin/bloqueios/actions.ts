"use server";

import { revalidatePath } from "next/cache";

import { isISODate } from "@/lib/dates";
import { requireAdmin } from "@/lib/dal";
import { BlockConflictError, createBlock, deleteBlock } from "@/lib/services/block";

export type FormState = { error?: string; ok?: boolean };

export async function createBlockAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const accommodationId = String(formData.get("accommodationId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 200) || null;

  if (!accommodationId) return { error: "Selecione uma acomodação." };
  if (!isISODate(startDate) || !isISODate(endDate)) return { error: "Datas inválidas." };
  if (!(startDate < endDate)) return { error: "A data final deve ser após a inicial." };

  try {
    await createBlock({ accommodationId, startDate, endDate, reason, adminId: admin.userId });
  } catch (error) {
    if (error instanceof BlockConflictError) {
      return {
        error:
          error.reason === "OVERLAP"
            ? "O período conflita com uma reserva ou bloqueio existente."
            : "Acomodação não encontrada.",
      };
    }
    throw error;
  }

  revalidatePath("/admin/bloqueios");
  revalidatePath("/admin/calendario");
  return { ok: true };
}

export async function deleteBlockAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteBlock(id, admin.userId);
  revalidatePath("/admin/bloqueios");
  revalidatePath("/admin/calendario");
}
