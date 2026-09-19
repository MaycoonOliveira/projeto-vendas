"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export type ToastAction = { label: string; onClick: () => void };
type ToastItem = { id: number; text: string; tone: ToastTone; action?: ToastAction };

const EVENT = "casa-toast";

/** Dispara um toast de qualquer client component do admin. `action` adiciona um botão (FIX 4). */
export function toast(
  text: string,
  tone: ToastTone = "success",
  action?: ToastAction,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, tone, action } }));
}

/** Mensagens acionadas por redirecionamento de Server Action (`?flash=<chave>`). */
const FLASH_MESSAGES: Record<string, { text: string; tone: ToastTone }> = {
  confirmed: { text: "Reserva confirmada.", tone: "success" },
  cancelled: { text: "Reserva cancelada.", tone: "success" },
  completed: { text: "Reserva concluída.", tone: "success" },
  no_show: { text: "Reserva marcada como no-show.", tone: "success" },
  saved: { text: "Alterações salvas.", tone: "success" },
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

/** Lê `?flash=<chave>` no carregamento, emite o toast e limpa o parâmetro da URL. */
function FlashFromParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const flash = params.get("flash");

  useEffect(() => {
    if (!flash) return;
    const msg = FLASH_MESSAGES[flash];
    if (msg) toast(msg.text, msg.tone);
    // Remove só o `flash`, preservando os demais parâmetros.
    const next = new URLSearchParams(params);
    next.delete("flash");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  return null;
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<{ text: string; tone: ToastTone; action?: ToastAction }>).detail;
      if (!detail?.text) return;
      const id = ++counter;
      setItems((prev) => [
        ...prev,
        { id, text: detail.text, tone: detail.tone ?? "success", action: detail.action },
      ]);
      // Toasts com ação (ex.: "Recarregar") ficam mais tempo na tela.
      window.setTimeout(
        () => setItems((prev) => prev.filter((t) => t.id !== id)),
        detail.action ? 12000 : 4500,
      );
    }
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

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
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-[var(--shadow-lift)] ${className}`}
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
