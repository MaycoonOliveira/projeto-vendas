"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/admin/toaster";
import {
  SETTING_FIELDS,
  SETTING_SECTIONS,
  type SettingField,
  type SettingSection,
} from "@/lib/settings-fields";
import { saveSettingsAction, type FormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

function Field({ f, value }: { f: SettingField; value: string }) {
  return (
    <div>
      <label htmlFor={f.key} className={labelClass}>{f.label}</label>
      {f.type === "textarea" ? (
        <textarea id={f.key} name={f.key} rows={3} defaultValue={value} placeholder={f.placeholder} className={inputClass} />
      ) : (
        <input
          id={f.key}
          name={f.key}
          type={f.type === "number" ? "number" : f.type === "time" ? "time" : "text"}
          defaultValue={value}
          placeholder={f.placeholder}
          className={inputClass}
        />
      )}
      {f.help ? <p className="mt-1 text-xs text-foreground/45">{f.help}</p> : null}
    </div>
  );
}

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettingsAction, {});
  const [active, setActive] = useState<SettingSection["id"]>("pousada");

  useEffect(() => {
    if (state.ok) toast("Configurações salvas.");
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Abas */}
      <div className="flex flex-wrap gap-1 border-b border-border" role="tablist" aria-label="Seções">
        {SETTING_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={active === s.id}
            onClick={() => setActive(s.id)}
            className={`-mb-px rounded-t-lg border-b-2 px-3 py-2 text-sm transition-colors ${
              active === s.id
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-foreground/55 hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Todas as seções ficam no DOM (hidden quando inativas) para que TODOS os campos sejam
          enviados no submit — evita sobrescrever chaves de abas não visíveis. */}
      {SETTING_SECTIONS.map((s) => {
        const fields = SETTING_FIELDS.filter((f) => f.section === s.id);
        return (
          <div key={s.id} hidden={active !== s.id} role="tabpanel" aria-label={s.label}>
            {s.description ? <p className="mb-4 text-sm text-foreground/55">{s.description}</p> : null}
            {s.id === "integracoes" ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-foreground/60">
                <p className="font-medium text-foreground/80">Sincronização de calendários (iCal)</p>
                <p className="mt-1">
                  Em breve: cole aqui as URLs de calendário do Airbnb/Booking/Google e copie a URL de
                  exportação do nosso sistema. Planejado para a V2 (Availability Engine).
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                    <Field f={f} value={values[f.key] ?? ""} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div>
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Salvando…" : "Salvar configurações"}
        </Button>
      </div>
    </form>
  );
}
