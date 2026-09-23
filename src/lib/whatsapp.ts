import { siteConfig } from "@/config/site";
import { brPhoneToWaDigits } from "@/lib/masks";

/**
 * Monta um link wa.me com mensagem pré-preenchida.
 * Centraliza o número para não hardcodar telefone em vários componentes.
 */
export function buildWhatsappUrl(message?: string) {
  const phone = siteConfig.contact.whatsapp.replace(/\D/g, "");
  const text = encodeURIComponent(
    message ?? siteConfig.contact.whatsappMessage,
  );
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Link wa.me a partir de um número arbitrário (ex.: o "WhatsApp de contato" das Configurações).
 * Normaliza para dígitos E.164 (prefixa 55 se faltar). Cai no número do siteConfig se vier vazio.
 */
export function waHrefFromPhone(phone: string | undefined | null, message?: string) {
  const digits = brPhoneToWaDigits(phone ?? "") || siteConfig.contact.whatsapp.replace(/\D/g, "");
  const text = encodeURIComponent(message ?? siteConfig.contact.whatsappMessage);
  return `https://wa.me/${digits}?text=${text}`;
}

/** Link de telefone (tel:) a partir do número E.164 configurado. */
export function buildPhoneUrl() {
  return `tel:${siteConfig.contact.phoneE164.replace(/[^\d+]/g, "")}`;
}
