import { desc, eq, inArray, sql, type InferSelectModel } from "drizzle-orm";

import { db } from "@/db";
import { auditLog, payment, PAYMENT_METHODS, reservation } from "@/db/schema";
import { ReservationConflictError } from "@/lib/services/reservation";
import { createNotification } from "@/lib/services/notification";
import { formatCentsBRL } from "@/lib/utils";

export type Payment = InferSelectModel<typeof payment>;

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CARD: "Cartão",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

function isValidMethod(m: string): boolean {
  return (PAYMENT_METHODS as readonly string[]).includes(m);
}

/** Registra um pagamento manual de uma reserva (Fase 8.3) + auditoria. */
export async function recordPayment(input: {
  reservationId: string;
  amountCents: number;
  paidOn: string;
  method: string;
  note?: string | null;
  adminId?: string | null;
}): Promise<Payment> {
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new ReservationConflictError("UNAVAILABLE", "Valor inválido.");
  }
  if (!isValidMethod(input.method)) {
    throw new ReservationConflictError("UNAVAILABLE", "Método de pagamento inválido.");
  }

  return db.transaction(async (tx) => {
    const exists = await tx
      .select({ id: reservation.id })
      .from(reservation)
      .where(eq(reservation.id, input.reservationId))
      .limit(1);
    if (!exists[0]) {
      throw new ReservationConflictError("NOT_FOUND", "Reserva não encontrada.");
    }

    const [row] = await tx
      .insert(payment)
      .values({
        reservationId: input.reservationId,
        amountCents: input.amountCents,
        paidOn: input.paidOn,
        method: input.method,
        note: input.note ?? null,
        recordedByAdminId: input.adminId ?? null,
      })
      .returning();

    await tx.insert(auditLog).values({
      actorType: "USER",
      actorId: input.adminId ?? null,
      action: "payment.record",
      entityType: "payment",
      entityId: row.id,
      metadata: { reservationId: input.reservationId, amountCents: input.amountCents },
    });

    return row;
  }).then(async (row) => {
    await createNotification({
      type: "PAYMENT_RECORDED",
      title: "Pagamento registrado",
      body: `${formatCentsBRL(input.amountCents)} recebido${input.method ? ` via ${input.method}` : ""}.`,
      entityType: "reservation",
      entityId: input.reservationId,
      link: `/admin/reservas/${input.reservationId}`,
    });
    return row;
  });
}

/** Remove um pagamento (correção de lançamento) + auditoria. */
export async function deletePayment(id: string, adminId?: string | null): Promise<boolean> {
  const [row] = await db
    .delete(payment)
    .where(eq(payment.id, id))
    .returning({ id: payment.id });
  if (row) {
    await db.insert(auditLog).values({
      actorType: "USER",
      actorId: adminId ?? null,
      action: "payment.delete",
      entityType: "payment",
      entityId: id,
    });
  }
  return Boolean(row);
}

export async function listPayments(reservationId: string): Promise<Payment[]> {
  return db
    .select()
    .from(payment)
    .where(eq(payment.reservationId, reservationId))
    .orderBy(desc(payment.paidOn), desc(payment.createdAt));
}

/** Total pago (centavos) de uma reserva. */
export async function totalPaidCents(reservationId: string): Promise<number> {
  const rows = await db
    .select({ sum: sql<number>`coalesce(sum(${payment.amountCents}), 0)::int` })
    .from(payment)
    .where(eq(payment.reservationId, reservationId));
  return rows[0]?.sum ?? 0;
}

/** Total pago por reserva (para listas/financeiro) — evita N+1. */
export async function totalPaidByReservation(
  reservationIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (reservationIds.length === 0) return out;
  const rows = await db
    .select({
      reservationId: payment.reservationId,
      sum: sql<number>`sum(${payment.amountCents})::int`,
    })
    .from(payment)
    .where(inArray(payment.reservationId, reservationIds))
    .groupBy(payment.reservationId);
  for (const row of rows) out.set(row.reservationId, row.sum);
  return out;
}
