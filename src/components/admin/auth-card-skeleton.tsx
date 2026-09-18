/**
 * Skeleton das telas públicas de autenticação do admin (login, esqueci/redefinir senha).
 *
 * Existe para NÃO herdar o `admin/loading.tsx` (esqueleto do PAINEL, com KPIs) — que dava a
 * impressão errada de "já estar logado" ao abrir /admin/esqueci-senha. Aqui mostramos um card
 * central neutro, coerente com o layout dessas telas.
 */
export function AuthCardSkeleton() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-muted px-4 py-12"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando…</span>
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-white p-8 shadow-[var(--shadow-soft)]">
        <div className="mx-auto h-7 w-40 animate-pulse rounded bg-foreground/10" />
        <div className="mx-auto mt-2 h-4 w-52 animate-pulse rounded bg-foreground/10" />
        <div className="mt-8 h-4 w-16 animate-pulse rounded bg-foreground/10" />
        <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-foreground/10" />
        <div className="mt-5 h-11 w-full animate-pulse rounded-xl bg-foreground/15" />
      </div>
    </div>
  );
}
