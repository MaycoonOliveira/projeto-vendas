"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export type ToastAction = { label: string; onClick: () => void };
type ToastItem = { id: number; text: string; tone: ToastTone; action?: ToastAction };
type PendingToast = { text: string; tone: ToastTone; action?: ToastAction };

/**
 * Canal de toasts em nível de MÓDULO (não via evento de `window`).
 *
 * Motivo: o antigo `window.dispatchEvent` dependia de o `Toaster` já ter registrado o listener.
 * Como o `Toaster` é montado por-página (dentro do `AdminShell`) e há `loading.tsx` no /admin, a
 * árvore remonta a cada navegação — e um toast disparado por `?flash=` (logo após um redirect de
 * Server Action) chegava ANTES do listener existir, ou num instância do `Toaster` que já fora
 * substituída. Resultado: o toast "sumia".
 *
 * Solução: um ponteiro `live` para o `add` do `Toaster` atualmente montado + uma `queue` que
 * bufferiza toasts disparados enquanto nenhum `Toaster` está vivo. Ao montar, o `Toaster` assume
 * `live` e drena a fila. Assim o toast nunca se perde, independente de ordem de efeitos/remontagem.
 */
let live: ((t: PendingToast) => void) | null = null;
let queue: PendingToast[] = [];

/** Dispara um toast de qualquer client component do admin. `action` adiciona um botão. */
export function toast(
  text: string,
  tone: ToastTone = "success",
  action?: ToastAction,
) {
  const t: PendingToast = { text, tone, action };
  if (live) live(t);
  else queue.push(t);
}

/** Mensagens acionadas por redirecionamento de Server Action (`?flash=<chave>`). */
const FLASH_MESSAGES: Record<string, { text: string; tone: ToastTone }> = {
  confirmed: { text: "Reserva confirmada.", tone: "success" },
  cancelled: { text: "Reserva cancelada.", tone: "success" },
  completed: { text: "Reserva concluída.", tone: "success" },
  no_show: { text: "Reserva marcada como no-show.", tone: "success" },
  saved: { text: "Alterações salvas.", tone: "success" },
  acc_created: { text: "Acomodação criada.", tone: "success" },
  acc_saved: { text: "Acomodação salva.", tone: "success" },
  rate_saved: { text: "Tarifa adicionada.", tone: "success" },
  rate_removed: { text: "Tarifa removida.", tone: "success" },
  created: { text: "Reserva criada.", tone: "success" },
  blocked: { text: "Bloqueio criado.", tone: "success" },
  unblocked: { text: "Bloqueio removido.", tone: "success" },
  settings_saved: { text: "Configurações salvas.", tone: "success" },
  checked_in: { text: "Check-in registrado.", tone: "success" },
  checked_out: { text: "Check-out registrado.", tone: "success" },
  note_saved: { text: "Nota interna salva.", tone: "success" },
  payment_recorded: { text: "Pagamento registrado.", tone: "success" },
  payment_deleted: { text: "Pagamento removido.", tone: "success" },
  payment_invalid: { text: "Não foi possível registrar o pagamento.", tone: "error" },
  photo_added: { text: "Foto adicionada.", tone: "success" },
  photo_deleted: { text: "Foto removida.", tone: "success" },
  photo_invalid: { text: "URL de imagem inválida (use http/https).", tone: "error" },
  photo_too_large: { text: "Imagem acima de 6MB — reduza o arquivo.", tone: "error" },
  photo_not_image: {
    text: "Arquivo não é uma imagem válida (JPG, PNG, WEBP, AVIF ou GIF).",
    tone: "error",
  },
  photo_storage: {
    text: "Armazenamento de imagens indisponível. Use uma URL de imagem.",
    tone: "error",
  },
  photo_upload_failed: {
    text: "Falha ao enviar a imagem. Tente novamente.",
    tone: "error",
  },
  guest_saved: { text: "Dados do hóspede salvos.", tone: "success" },
  guest_status: { text: "Status do hóspede atualizado.", tone: "success" },
  role_saved: { text: "Papel atualizado.", tone: "success" },
  active_saved: { text: "Status do usuário atualizado.", tone: "success" },
  team_error: { text: "Não foi possível concluir (ver regras de acesso).", tone: "error" },
  denied: { text: "Acesso restrito ao proprietário.", tone: "error" },
  msg_logged: { text: "Comunicação registrada.", tone: "success" },
};

const TONE_STYLE: Record<ToastTone, { className: string; Icon: typeof CheckCircle2 }> = {
  success: { className: "border-green-200 bg-green-50 text-green-900", Icon: CheckCircle2 },
  error: { className: "border-red-200 bg-red-50 text-red-900", Icon: XCircle },
  info: { className: "border-border bg-white text-foreground", Icon: Info },
};

let counter = 0;

/**
 * Lê `?flash=<chave>` no carregamento, dispara o toast (via `toast()` de módulo — que bufferiza
 * se nenhum `Toaster` estiver vivo ainda) e limpa o parâmetro da URL com `history.replaceState`
 * (só o browser). Não usamos `router.replace`: ele dispara navegação RSC → `loading.tsx` → remonta
 * a árvore (o `Toaster` é por-página), o que descartaria o toast recém-adicionado.
 */
function FlashFromParams() {
  const params = useSearchParams();
  const pathname = usePathname();
  const flash = params.get("flash");

  useEffect(() => {
    if (!flash) return;
    const msg = FLASH_MESSAGES[flash];
    if (msg) toast(msg.text, msg.tone);
    const next = new URLSearchParams(params);
    next.delete("flash");
    const qs = next.toString();
    window.history.replaceState(window.history.state, "", qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  return null;
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  // Adiciona um toast à fila e agenda o auto-descarte. Estável entre renders.
  const add = useCallback((t: PendingToast) => {
    const id = ++counter;
    setItems((prev) => [...prev, { id, ...t }]);
    // Toasts com ação (ex.: "Recarregar") ficam mais tempo na tela.
    window.setTimeout(
      () => setItems((prev) => prev.filter((x) => x.id !== id)),
      t.action ? 12000 : 4500,
    );
  }, []);

  // Assume o canal de toasts: vira o `live` e drena a fila acumulada antes da montagem.
  useEffect(() => {
    live = add;
    if (queue.length) {
      const pending = queue;
      queue = [];
      // Drenar a fila logo na montagem é intencional (mostra toasts disparados antes de existir
      // um Toaster vivo, ex.: `?flash=` após redirect). `add` só chama setState após render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      for (const t of pending) add(t);
    }
    return () => {
      if (live === add) live = null;
    };
  }, [add]);

  return (
    <>
      <Suspense fallback={null}>
        <FlashFromParams />
      </Suspense>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6"
        role="region"
        aria-label="Notificações"
      >
        {items.map((t) => {
          const { className, Icon } = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-lift)] [animation:var(--animate-toast-in)] ${className}`}
            >
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span className="flex-1">{t.text}</span>
              {t.action ? (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    setItems((prev) => prev.filter((x) => x.id !== t.id));
                  }}
                  className="shrink-0 rounded-lg bg-foreground/10 px-2.5 py-1 text-xs font-semibold hover:bg-foreground/15"
                >
                  {t.action.label}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Fechar notificação"
                className="shrink-0 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
