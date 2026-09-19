"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Botão de submit com estado de carregamento AUTOMÁTICO (FIX 5).
 *
 * Usa `useFormStatus()` (React 19): dentro de um `<form action={serverAction}>`, fica desabilitado
 * e mostra um spinner enquanto a Server Action está pendente — sem precisar de estado manual.
 * Deve ser renderizado COMO FILHO do `<form>` (o hook lê o status do form pai).
 */
export function SubmitButton({
  children,
  className,
  pendingLabel,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={cn(
        "inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
