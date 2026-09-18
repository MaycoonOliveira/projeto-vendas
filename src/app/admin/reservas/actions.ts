"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/dal";
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  completeReservation,
  confirmReservation,
  editReservation,
  noShowReservation,
  setInternalNote,
} from "@/lib/services/reservation-admin";
import {
  createReservation,
  ReservationConflictError,
} from "@/lib/services/reservation";
import { deletePayment, recordPayment } from "@/lib/services/payment";
import { ReservationCreateSchema } from "@/lib/validation/reservation";
import { isISODate } from "@/lib/dates";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

function messageFor(error: ReservationConflictError): string {
  switch (error.reason) {
    case "UNAVAILABLE":
      return "As datas conflitam com outra reserva ou bloqueio.";
    case "CAPACITY":
      return "Número de hóspedes acima da capacidade.";
    case "MIN_NIGHTS":
      return error.message;
    case "VERSION":
      return "A reserva foi alterada por outra pessoa. Recarregue a página.";
    case "INVALID_TRANSITION":
      return error.message;
    default:
      return "Operação não permitida.";
  }
}

/** Ações de status (confirmar/cancelar/concluir/no-show) — formulários simples. */
export async function confirmReservationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await confirmReservation(id, admin.userId);
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin/reservas");
  revalidatePath("/admin");
  redirect(`/admin/reservas/${id}?flash=confirmed`);
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").slice(0, 500) || null;
  if (id) await cancelReservation(id, admin.userId, reason);
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin/reservas");
  revalidatePath("/admin");
  redirect(`/admin/reservas/${id}?flash=cancelled`);
}

export async function completeReservationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await completeReservation(id, admin.userId);
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/reservas/${id}?flash=completed`);
}

export async function noShowReservationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await noShowReservation(id, admin.userId);
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/reservas/${id}?flash=no_show`);
}

export async function checkInReservationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await checkInReservation(id, admin.userId);
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/reservas/${id}?flash=checked_in`);
}

export async function checkOutReservationAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await checkOutReservation(id, admin.userId);
  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/reservas/${id}?flash=checked_out`);
}

/** Nota interna (admin) — distinta da observação do hóspede. */
export async function updateInternalNoteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("internalNote") ?? "").slice(0, 2000).trim() || null;
  if (id) await setInternalNote(id, note, admin.userId);
  revalidatePath(`/admin/reservas/${id}`);
  redirect(`/admin/reservas/${id}?flash=note_saved`);
}

/** Converte "1.234,56" ou "1234.56" em centavos (inteiro). Retorna NaN se inválido. */
function brlToCents(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  // Se veio de <input type=number> (ponto decimal), a limpeza acima quebra: tenta os dois.
  const asNumber = raw.includes(",") ? Number(cleaned) : Number(raw);
  return Math.round(asNumber * 100);
}

/** Registro de pagamento manual (Fase 8.3). */
export async function recordPaymentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const reservationId = String(formData.get("reservationId") ?? "");
  const amountRaw = String(formData.get("amount") ?? "");
  const paidOn = String(formData.get("paidOn") ?? "");
  const method = String(formData.get("method") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 500).trim() || null;

  const amountCents = brlToCents(amountRaw);
  if (
    !reservationId ||
    !Number.isFinite(amountCents) ||
    amountCents <= 0 ||
    !isISODate(paidOn)
  ) {
    redirect(`/admin/reservas/${reservationId}?flash=payment_invalid`);
  }

  try {
    await recordPayment({ reservationId, amountCents, paidOn, method, note, adminId: admin.userId });
  } catch (error) {
    if (error instanceof ReservationConflictError) {
      redirect(`/admin/reservas/${reservationId}?flash=payment_invalid`);
    }
    throw error;
  }
  revalidatePath(`/admin/reservas/${reservationId}`);
  revalidatePath("/admin");
  redirect(`/admin/reservas/${reservationId}?flash=payment_recorded`);
}

export async function deletePaymentAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const reservationId = String(formData.get("reservationId") ?? "");
  if (id) await deletePayment(id, admin.userId);
  revalidatePath(`/admin/reservas/${reservationId}`);
  redirect(`/admin/reservas/${reservationId}?flash=payment_deleted`);
}

/** Edição de datas/hóspedes com optimistic locking. */
export async function editReservationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const version = Number(formData.get("version") ?? "");
  const checkIn = String(formData.get("checkIn") ?? "");
  const checkOut = String(formData.get("checkOut") ?? "");
  const guestsCount = Number(formData.get("guestsCount") ?? "");

  if (!id || !Number.isInteger(version)) return { error: "Dados inválidos." };
  if (!isISODate(checkIn) || !isISODate(checkOut)) {
    return { error: "Datas inválidas." };
  }
  if (!(guestsCount >= 1)) return { error: "Número de hóspedes inválido." };

  try {
    await editReservation(id, { checkIn, checkOut, guestsCount }, version, admin.userId);
  } catch (error) {
    if (error instanceof ReservationConflictError) {
      return { error: messageFor(error) };
    }
    throw error;
  }

  revalidatePath(`/admin/reservas/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/reservas/${id}?flash=saved`);
}

/** Reserva manual (nasce CONFIRMED, sem hold). */
export async function createManualReservationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();

  const parsed = ReservationCreateSchema.safeParse({
    accommodationId: formData.get("accommodationId") ?? "",
    checkin: formData.get("checkin") ?? "",
    checkout: formData.get("checkout") ?? "",
    guestsCount: formData.get("guestsCount") ?? "",
    guest: {
      fullName: formData.get("fullName") ?? "",
      email: formData.get("email") ?? "",
      phone: formData.get("phone") ?? "",
      notes: formData.get("notes") ?? undefined,
    },
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const data = parsed.data;

  let created;
  try {
    created = await createReservation({
      accommodationId: data.accommodationId,
      checkIn: data.checkin,
      checkOut: data.checkout,
      guestsCount: data.guestsCount,
      guest: data.guest,
      source: "MANUAL",
      createdByAdminId: admin.userId,
    });
  } catch (error) {
    if (error instanceof ReservationConflictError) {
      return { error: messageFor(error) };
    }
    throw error;
  }

  revalidatePath("/admin/reservas");
  revalidatePath("/admin");
  redirect(`/admin/reservas/${created.reservation.id}?flash=created`);
}
