"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/dal";
import { addGuestMessage, setGuestStatus, updateGuestCrm } from "@/lib/services/guest";

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

/** Registra uma comunicação (mensageria) com o hóspede. */
export async function addGuestMessageAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const guestId = String(formData.get("guestId") ?? "");
  const channel = String(formData.get("channel") ?? "NOTE");
  const direction = String(formData.get("direction") ?? "OUT");
  const body = String(formData.get("body") ?? "");
  if (guestId && body.trim()) {
    await addGuestMessage({ guestId, channel, direction, body, adminId: admin.userId });
  }
  revalidatePath(`/admin/hospedes/${guestId}`);
  redirect(`/admin/hospedes/${guestId}?flash=msg_logged`);
}
