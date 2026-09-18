"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/dal";
import { setGuestStatus, updateGuestCrm } from "@/lib/services/guest";

export async function updateGuestCrmAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/hospedes");

  await updateGuestCrm(
    id,
    {
      documentType: String(formData.get("documentType") ?? "") || null,
      documentNumber: String(formData.get("documentNumber") ?? "").trim() || null,
      birthDate: String(formData.get("birthDate") ?? "") || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
    admin.userId,
  );

  revalidatePath(`/admin/hospedes/${id}`);
  redirect(`/admin/hospedes/${id}?flash=guest_saved`);
}

export async function setGuestStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (id) await setGuestStatus(id, status, admin.userId);
  revalidatePath(`/admin/hospedes/${id}`);
  revalidatePath("/admin/hospedes");
  redirect(`/admin/hospedes/${id}?flash=guest_status`);
}
