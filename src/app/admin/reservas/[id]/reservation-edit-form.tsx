"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { editReservationAction, type FormState } from "../actions";

const inputClass =
  "h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

export function ReservationEditForm({
  id,
  version,
  checkIn,
  checkOut,
  guestsCount,
}: {
  id: string;
  version: number;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    editReservationAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="version" value={version} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="checkIn" className={labelClass}>
            Check-in
          </label>
          <input id="checkIn" name="checkIn" type="date" defaultValue={checkIn} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="checkOut" className={labelClass}>
            Check-out
          </label>
          <input id="checkOut" name="checkOut" type="date" defaultValue={checkOut} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="guestsCount" className={labelClass}>
            Hóspedes
          </label>
          <input id="guestsCount" name="guestsCount" type="number" min={1} defaultValue={guestsCount} required className={inputClass} />
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
