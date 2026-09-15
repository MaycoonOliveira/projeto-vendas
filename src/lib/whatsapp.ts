import { siteConfig } from "@/config/site";

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

/** Link de telefone (tel:) a partir do número E.164 configurado. */
export function buildPhoneUrl() {
  return `tel:${siteConfig.contact.phoneE164.replace(/[^\d+]/g, "")}`;
}
