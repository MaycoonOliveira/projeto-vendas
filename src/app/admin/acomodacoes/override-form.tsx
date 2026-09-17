"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { createOverrideAction, type FormState } from "./actions";

const inputClass =
  "h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export function OverrideForm({ accommodationId }: { accommodationId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createOverrideAction,
    {},
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="accommodationId" value={accommodationId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_1.4fr_auto] sm:items-end">
        <div>
          <label htmlFor="startDate" className="mb-1 block text-xs font-medium text-foreground/70">
            Início
          </label>
          <input id="startDate" name="startDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1 block text-xs font-medium text-foreground/70">
            Fim
          </label>
          <input id="endDate" name="endDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="priceReais" className="mb-1 block text-xs font-medium text-foreground/70">
            Preço/noite (R$)
          </label>
          <input id="priceReais" name="priceReais" type="number" min={0} step="0.01" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="label" className="mb-1 block text-xs font-medium text-foreground/70">
            Rótulo (opcional)
          </label>
          <input id="label" name="label" placeholder="Alta temporada" className={inputClass} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Adicionar"}
        </Button>
      </div>

      {fe.endDate || fe.startDate ? (
        <p className="text-xs text-red-600">{fe.endDate ?? fe.startDate}</p>
      ) : null}
      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
