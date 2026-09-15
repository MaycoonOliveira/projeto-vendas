import { AlertTriangle } from "lucide-react";

/**
 * Aviso visível de que o texto legal é um MODELO e precisa de revisão jurídica.
 * Remova este componente da página após a validação do conteúdo pelo cliente.
 */
export function LegalNotice() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-foreground"
    >
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
      <p>
        <strong>Documento modelo (placeholder).</strong> Este texto é um ponto de
        partida e precisa ser revisado e aprovado juridicamente antes da
        publicação. Ver <code>docs/client-content-checklist.md</code>.
      </p>
    </div>
  );
}
