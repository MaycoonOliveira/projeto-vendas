"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { resetPasswordAction, type ResetState } from "../actions";

const inputClass =
  "h-11 w-full rounded-xl border border-foreground/15 bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    resetPasswordAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          className={inputClass}
          placeholder="mínimo 12 caracteres"
        />
        <p className="text-xs text-foreground/50">Use ao menos 12 caracteres.</p>
      </div>

      {state?.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? "Salvando…" : "Redefinir senha"}
      </Button>
    </form>
  );
}
