"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { createManualReservationAction, type FormState } from "../actions";

const inputClass =
  "h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

export function ManualReservationForm({
  accommodations,
}: {
  accommodations: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createManualReservationAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="accommodationId" className={labelClass}>
          Acomodação
        </label>
        <select id="accommodationId" name="accommodationId" required className={inputClass}>
          {accommodations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="checkin" className={labelClass}>Check-in</label>
          <input id="checkin" name="checkin" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="checkout" className={labelClass}>Check-out</label>
          <input id="checkout" name="checkout" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="guestsCount" className={labelClass}>Hóspedes</label>
          <input id="guestsCount" name="guestsCount" type="number" min={1} defaultValue={2} required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="fullName" className={labelClass}>Nome do hóspede</label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>E-mail</label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Telefone / WhatsApp</label>
          <input id="phone" name="phone" required className={inputClass} />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className={labelClass}>Observações (opcional)</label>
        <textarea id="notes" name="notes" rows={2} className={`${inputClass} h-auto py-2`} />
      </div>

      <p className="text-xs text-foreground/50">
        A reserva manual nasce <strong>confirmada</strong> e ocupa o inventário imediatamente
        (passa pela mesma verificação anti-sobreposição).
      </p>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Criando…" : "Criar reserva confirmada"}
        </Button>
      </div>
    </form>
  );
}
