/**
 * Skeleton exibido enquanto as páginas do admin carregam (Suspense do segmento).
 * Importante nesta hospedagem: a 1ª consulta ao banco (Supabase free) pode demorar
 * no cold-start — o skeleton evita tela em branco e comunica progresso.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="font-serif text-lg font-semibold text-foreground">
            Casa Carram · Admin
          </span>
          <div className="size-9 animate-pulse rounded-full bg-foreground/10" />
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Carregando…</span>

        {/* Título */}
        <div className="h-7 w-48 animate-pulse rounded bg-foreground/10" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-foreground/10" />

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-white p-4">
              <div className="size-9 animate-pulse rounded-full bg-foreground/10" />
              <div className="mt-3 h-7 w-10 animate-pulse rounded bg-foreground/10" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-foreground/10" />
            </div>
          ))}
        </div>

        {/* Bloco grande (calendário/lista) */}
        <div className="mt-6 h-80 animate-pulse rounded-xl border border-border bg-white" />
      </main>
    </div>
  );
}
