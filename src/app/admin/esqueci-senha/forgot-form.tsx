"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { forgetPasswordAction, type ForgotState } from "../actions";

const inputClass =
  "h-11 w-full rounded-xl border border-foreground/15 bg-white px-4 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    forgetPasswordAction,
    {},
  );

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground/70">
          Se houver uma conta com esse e-mail, enviamos um link para redefinir a
          senha. Verifique sua caixa de entrada (e o spam).
        </p>
        <Link
          href="/admin/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
          placeholder="voce@exemplo.com"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? "Enviando…" : "Enviar link de redefinição"}
      </Button>

      <Link
        href="/admin/login"
        className="text-center text-sm text-foreground/60 hover:text-foreground"
      >
        Voltar ao login
      </Link>
    </form>
  );
}
