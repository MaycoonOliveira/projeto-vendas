import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/dal";
import { getGuestProfile } from "@/lib/services/guest";
import { GUEST_STATUSES } from "@/db/schema";
import { effectiveStatus, RESERVATION_STATUS_LABEL } from "@/lib/reservation-status";
import { staysToNextTier } from "@/lib/loyalty";
import { formatCentsBRL } from "@/lib/utils";
import { setGuestStatusAction, updateGuestCrmAction } from "../actions";

export const metadata: Metadata = { title: "Hóspede" };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  NORMAL: { label: "Normal", className: "bg-muted text-foreground/60" },
  VIP: { label: "VIP", className: "bg-amber-100 text-amber-800" },
  BLACKLIST: { label: "Blacklist", className: "bg-red-100 text-red-700" },
};

const DOC_LABEL: Record<string, string> = { CPF: "CPF", PASSPORT: "Passaporte", OTHER: "Outro" };

const inputClass =
  "h-10 w-full rounded-lg border border-foreground/15 bg-white px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25";
const labelClass = "mb-1 block text-xs font-medium text-foreground/70";

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const profile = await getGuestProfile(id);
  if (!profile) notFound();

  const { guest: g, stays, staysCount, totalSpentCents, avgTicketCents, tier } = profile;
  const statusBadge = STATUS_BADGE[g.status] ?? STATUS_BADGE.NORMAL;
  const nextTier = staysToNextTier(staysCount);

  return (
    <AdminShell>
      <Link href="/admin/hospedes" className="text-sm text-foreground/60 hover:text-foreground">
        ← Hóspedes
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold text-foreground">{g.fullName}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${tier.className}`}>
          {tier.label}
        </span>
      </div>

      {/* KPIs do hóspede */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Estadias" value={String(staysCount)} />
        <Kpi label="Total gasto" value={formatCentsBRL(totalSpentCents)} />
        <Kpi label="Ticket médio" value={formatCentsBRL(avgTicketCents)} />
        <Kpi
          label="Fidelidade"
          value={tier.label}
          hint={nextTier ? `Faltam ${nextTier.missing} p/ ${nextTier.tier.label}` : "Nível máximo"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Contato + status */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Contato</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row label="E-mail" value={g.email} />
            <Row label="Telefone" value={g.phone} />
          </dl>

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-foreground/50">Status (CRM)</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {GUEST_STATUSES.map((s) => (
              <form key={s} action={setGuestStatusAction}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="status" value={s} />
                <button
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    g.status === s
                      ? "bg-foreground text-white"
                      : "border border-border text-foreground/70 hover:bg-foreground/5"
                  }`}
                >
                  {STATUS_BADGE[s]?.label ?? s}
                </button>
              </form>
            ))}
          </div>
        </section>

        {/* Dados de CRM editáveis */}
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Dados do hóspede</h2>
          <p className="mt-1 text-xs text-foreground/50">
            Dados sensíveis — acesso restrito ao painel (LGPD). Não expostos ao público.
          </p>
          <form action={updateGuestCrmAction} className="mt-3 grid gap-3">
            <input type="hidden" name="id" value={g.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="documentType" className={labelClass}>Tipo de documento</label>
                <select id="documentType" name="documentType" defaultValue={g.documentType ?? ""} className={inputClass}>
                  <option value="">—</option>
                  {Object.entries(DOC_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="documentNumber" className={labelClass}>Número do documento</label>
                <input id="documentNumber" name="documentNumber" defaultValue={g.documentNumber ?? ""} className={inputClass} />
              </div>
            </div>
            <div className="sm:w-1/2">
              <label htmlFor="birthDate" className={labelClass}>Aniversário</label>
              <input id="birthDate" name="birthDate" type="date" defaultValue={g.birthDate ?? ""} className={inputClass} />
            </div>
            <div>
              <label htmlFor="notes" className={labelClass}>Observações internas</label>
              <textarea id="notes" name="notes" rows={3} defaultValue={g.notes ?? ""} className={`${inputClass} h-auto py-2`} />
            </div>
            <div>
              <button className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-foreground/5">
                Salvar dados
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Histórico de estadias */}
      <section className="mt-6 rounded-xl border border-border bg-white p-5">
        <h2 className="text-sm font-semibold text-foreground">Histórico de estadias</h2>
        {stays.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">Sem reservas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {stays.map((s) => {
              const eff = effectiveStatus(s.status, null);
              const badge = RESERVATION_STATUS_LABEL[eff] ?? RESERVATION_STATUS_LABEL.PENDING;
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/reservas/${s.id}`} className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {s.accommodationName}
                    </span>
                    <span className="block truncate text-xs text-foreground/50">
                      {s.checkIn} → {s.checkOut} · {formatCentsBRL(s.totalPriceCents)}
                    </span>
                  </Link>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-foreground/50">{label}</p>
      {hint ? <p className="text-[11px] text-foreground/40">{hint}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-foreground/50">{label}</dt>
      <dd className="text-right text-foreground/90">{value}</dd>
    </div>
  );
}
