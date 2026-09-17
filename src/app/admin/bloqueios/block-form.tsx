"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/admin/toaster";
import { createBlockAction, type FormState } from "./actions";

const inputClass =
  "h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

export function BlockForm({
  accommodations,
}: {
  accommodations: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createBlockAction,
    {},
  );

  useEffect(() => {
    if (state.ok) toast("Bloqueio criado.");
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_1.4fr_auto] sm:items-end">
        <div>
          <label htmlFor="accommodationId" className={labelClass}>Acomodação</label>
          <select id="accommodationId" name="accommodationId" required className={inputClass}>
            {accommodations.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startDate" className={labelClass}>Início</label>
          <input id="startDate" name="startDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="endDate" className={labelClass}>Fim</label>
          <input id="endDate" name="endDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="reason" className={labelClass}>Motivo (opcional)</label>
          <input id="reason" name="reason" placeholder="Manutenção" className={inputClass} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Bloquear"}
        </Button>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
