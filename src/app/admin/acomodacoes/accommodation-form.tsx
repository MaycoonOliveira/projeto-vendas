"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/admin/toaster";
import type { FormState } from "./actions";

const inputClass =
  "h-11 w-full rounded-xl border border-foreground/15 bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export type AccommodationFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  capacity?: number;
  basePriceReais?: string;
  minNights?: number;
  isActive?: boolean;
  sortOrder?: number;
};

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-600">{msg}</p>;
}

export function AccommodationForm({
  action,
  values,
  submitLabel,
}: {
  action: Action;
  values?: AccommodationFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const fe = state.fieldErrors ?? {};
  const v = values ?? {};

  // Sucesso vira toast via redirect (?flash=). Aqui cobrimos os erros que NÃO redirecionam
  // (validação/conflito voltam no state) — dispara um toast além da mensagem inline.
  const lastError = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (state.error && state.error !== lastError.current) {
      toast(state.error, "error");
    }
    lastError.current = state.error;
  }, [state]);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {v.id ? <input type="hidden" name="id" value={v.id} /> : null}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
          Nome
        </label>
        <input id="name" name="name" defaultValue={v.name} required className={inputClass} />
        <Err msg={fe.name} />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1.5 block text-sm font-medium text-foreground">
          Slug <span className="font-normal text-foreground/50">(deixe em branco para gerar a partir do nome)</span>
        </label>
        <input id="slug" name="slug" defaultValue={v.slug} placeholder="ex.: casa-principal" className={inputClass} />
        <Err msg={fe.slug} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-foreground">
          Descrição
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={v.description}
          rows={4}
          className="w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
        />
        <Err msg={fe.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="capacity" className="mb-1.5 block text-sm font-medium text-foreground">
            Capacidade (hóspedes)
          </label>
          <input id="capacity" name="capacity" type="number" min={1} max={50} defaultValue={v.capacity ?? 2} required className={inputClass} />
          <Err msg={fe.capacity} />
        </div>
        <div>
          <label htmlFor="basePriceReais" className="mb-1.5 block text-sm font-medium text-foreground">
            Preço base / noite (R$)
          </label>
          <input id="basePriceReais" name="basePriceReais" type="number" min={0} step="0.01" defaultValue={v.basePriceReais} required className={inputClass} />
          <Err msg={fe.basePriceReais} />
        </div>
        <div>
          <label htmlFor="minNights" className="mb-1.5 block text-sm font-medium text-foreground">
            Estadia mínima (noites)
          </label>
          <input id="minNights" name="minNights" type="number" min={1} max={365} defaultValue={v.minNights ?? 1} required className={inputClass} />
          <Err msg={fe.minNights} />
        </div>
        <div>
          <label htmlFor="sortOrder" className="mb-1.5 block text-sm font-medium text-foreground">
            Ordem de exibição
          </label>
          <input id="sortOrder" name="sortOrder" type="number" min={0} max={9999} defaultValue={v.sortOrder ?? 0} className={inputClass} />
          <Err msg={fe.sortOrder} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={v.isActive ?? true}
          className="size-4 rounded border-foreground/30"
        />
        Ativa (visível para reservas)
      </label>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
