"use server";

import { requireAdmin } from "@/lib/dal";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notification";

/** Marca uma notificação como lida. */
export async function markNotificationReadAction(id: string): Promise<void> {
  await requireAdmin();
  if (id) await markNotificationRead(id);
}

/** Marca todas as notificações como lidas. */
export async function markAllNotificationsReadAction(): Promise<void> {
  await requireAdmin();
  await markAllNotificationsRead();
}
