import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acesso administrativo",
  robots: { index: false, follow: false },
};

// CSP com nonce (proxy) exige render dinâmico.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo =
    redirect && redirect.startsWith("/admin") ? redirect : undefined;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-white p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Casa Carram
          </h1>
          <p className="mt-1 text-sm text-foreground/60">Painel administrativo</p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
