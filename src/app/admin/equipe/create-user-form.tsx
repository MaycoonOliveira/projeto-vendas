"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/admin/toaster";
import { createUserAction, type FormState } from "./actions";

const inputClass =
  "h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createUserAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast("Usuário criado. Peça para redefinir a senha no primeiro acesso.");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="name" className={labelClass}>Nome</label>
        <input id="name" name="name" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>E-mail</label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Senha provisória (mín. 12)</label>
        <input id="password" name="password" type="password" minLength={12} required className={inputClass} />
      </div>
      <div>
        <label htmlFor="role" className={labelClass}>Papel</label>
        <select id="role" name="role" defaultValue="STAFF" className={inputClass}>
          <option value="STAFF">Recepção (STAFF)</option>
          <option value="OWNER">Proprietário (OWNER)</option>
        </select>
      </div>
      {state.error ? (
        <p role="alert" className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Criando…" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
