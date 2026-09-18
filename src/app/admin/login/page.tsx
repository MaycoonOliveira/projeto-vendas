import type { Metadata } from "next";
import { redirect as navRedirect } from "next/navigation";

import { getSession } from "@/lib/dal";
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
  searchParams: Promise<{ redirect?: string; reset?: string }>;
}) {
  const { redirect, reset } = await searchParams;
  const redirectTo =
    redirect && redirect.startsWith("/admin") ? redirect : undefined;

  // Cortesia loop-safe: só redireciona quem tem sessão REAL e válida no DB (não só o cookie).
  const session = await getSession();
  const activeUser = session?.user as { isActive?: boolean } | undefined;
  if (activeUser && activeUser.isActive !== false) {
    navRedirect(redirectTo ?? "/admin");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-white p-8 shadow-[var(--shadow-soft)]">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Casa Carram
          </h1>
          <p className="mt-1 text-sm text-foreground/60">Painel administrativo</p>
        </div>
        {reset ? (
          <p className="mb-5 rounded-lg bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            Senha redefinida. Faça login com a nova senha.
          </p>
        ) : null}
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
