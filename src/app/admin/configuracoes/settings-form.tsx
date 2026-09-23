"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/admin/toaster";
import {
  SETTING_FIELDS,
  SETTING_SECTIONS,
  type SettingField,
  type SettingFieldMask,
  type SettingSection,
} from "@/lib/settings-fields";
import { maskCEP, maskCNPJ, maskPhoneBR, maskWhatsappBR } from "@/lib/masks";
import { saveSettingsAction, type FormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-white px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

const MASK_FN: Record<SettingFieldMask, (v: string) => string> = {
  phone: maskPhoneBR,
  "phone-intl": maskWhatsappBR,
  cnpj: maskCNPJ,
  cep: maskCEP,
};

// Só abas visíveis (as ocultas ficam mapeadas em settings-fields, mas fora da UI por ora).
const VISIBLE_SECTIONS = SETTING_SECTIONS.filter((s) => !s.hidden);

function Label({ f }: { f: SettingField }) {
  return (
    <label htmlFor={f.key} className={labelClass}>
      {f.label}
      {f.required ? <span className="ml-0.5 text-red-600">*</span> : null}
    </label>
  );
}

/** Campo com máscara: controlado, reaplica a máscara a cada digitação (client-safe, puro). */
function MaskedField({ f, value }: { f: SettingField; value: string }) {
  const fn = MASK_FN[f.mask!];
  const [val, setVal] = useState(() => fn(value));
  return (
    <div>
      <Label f={f} />
      <input
        id={f.key}
        name={f.key}
        type="text"
        inputMode={f.mask === "cnpj" || f.mask === "cep" ? "numeric" : "tel"}
        value={val}
        onChange={(e) => setVal(fn(e.target.value))}
        placeholder={f.placeholder}
        className={inputClass}
      />
      {f.help ? <p className="mt-1 text-xs text-foreground/45">{f.help}</p> : null}
    </div>
  );
}

function Field({ f, value }: { f: SettingField; value: string }) {
  if (f.mask) return <MaskedField f={f} value={value} />;
  return (
    <div>
      <Label f={f} />
      {f.type === "textarea" ? (
        <textarea id={f.key} name={f.key} rows={3} defaultValue={value} placeholder={f.placeholder} className={inputClass} />
      ) : (
        <input
          id={f.key}
          name={f.key}
          type={f.type === "number" ? "number" : f.type === "time" ? "time" : f.type === "email" ? "email" : "text"}
          inputMode={f.type === "email" ? "email" : undefined}
          autoCapitalize={f.type === "email" ? "none" : undefined}
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
  const [active, setActive] = useState<SettingSection["id"]>(VISIBLE_SECTIONS[0]?.id ?? "pousada");

  useEffect(() => {
    if (state.ok) toast("Configurações salvas.");
    else if (state.error) toast(state.error, "error");
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-6">
      {/* Abas (só as visíveis) */}
      <div className="flex flex-wrap gap-1 border-b border-border" role="tablist" aria-label="Seções">
        {VISIBLE_SECTIONS.map((s) => (
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

      {/* Só as seções visíveis vão ao DOM. Campos de abas ocultas NÃO são enviados — a action
          preserva seus valores salvos (só grava chaves presentes no formData). */}
      {VISIBLE_SECTIONS.map((s) => {
        const fields = SETTING_FIELDS.filter((f) => f.section === s.id);
        return (
          <div key={s.id} hidden={active !== s.id} role="tabpanel" aria-label={s.label}>
            {s.description ? <p className="mb-4 text-sm text-foreground/55">{s.description}</p> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Field f={f} value={values[f.key] ?? ""} />
                </div>
              ))}
            </div>
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
