"use client";

import { useActionState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/admin/toaster";
import { SETTING_FIELDS } from "@/lib/settings-fields";
import { saveSettingsAction, type FormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveSettingsAction,
    {},
  );

  useEffect(() => {
    if (state.ok) toast("Configurações salvas.");
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {SETTING_FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className={labelClass}>{f.label}</label>
          {f.type === "textarea" ? (
            <textarea id={f.key} name={f.key} rows={4} defaultValue={values[f.key] ?? ""} className={inputClass} />
          ) : (
            <input id={f.key} name={f.key} defaultValue={values[f.key] ?? ""} className={inputClass} />
          )}
        </div>
      ))}

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}
