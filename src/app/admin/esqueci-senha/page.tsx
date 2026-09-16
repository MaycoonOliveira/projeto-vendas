import type { Metadata } from "next";

import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Recuperar senha",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-white p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Recuperar senha
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Enviaremos um link para o seu e-mail.
          </p>
        </div>
        <ForgotForm />
      </div>
    </div>
  );
}
