import type { Metadata } from "next";
import Link from "next/link";

import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-white p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Redefinir senha
          </h1>
        </div>

        {token ? (
          <ResetForm token={token} />
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-foreground/70">
              Link inválido ou incompleto. Solicite um novo link de redefinição.
            </p>
            <Link
              href="/admin/esqueci-senha"
              className="text-sm font-medium text-primary hover:underline"
            >
              Solicitar novo link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
