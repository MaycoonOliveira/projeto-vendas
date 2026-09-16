import { requireAdmin } from "@/lib/dal";
import { signOutAction } from "./actions";

export default async function AdminDashboardPage() {
  // Autorização REAL (checagem no DB). Redireciona ao login se inválida.
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="font-serif text-lg font-semibold text-foreground">
            Casa Carram · Admin
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Bem-vindo, {session.name}
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Painel administrativo da Casa Carram. As funcionalidades de reservas,
          acomodações e disponibilidade chegam nas próximas fases.
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Sessão", value: "Ativa" },
            { label: "Papel", value: session.role },
            { label: "E-mail", value: session.email },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border bg-white p-4"
            >
              <dt className="text-xs uppercase tracking-wide text-foreground/50">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
