"use client";

import { CalendarCheck, MessageCircle, Phone } from "lucide-react";
import { buttonVariants, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { buildPhoneUrl, buildWhatsappUrl } from "@/lib/whatsapp";
import { track } from "@/lib/analytics";

type CtaProps = {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children?: React.ReactNode;
  withIcon?: boolean;
  /** Contexto opcional para o evento de analytics. */
  source?: string;
};

/** Botão principal de reserva (leva ao anúncio oficial no Airbnb). */
export function ReserveButton({
  variant = "primary",
  size = "md",
  className,
  children = "Reservar agora",
  withIcon = true,
  source,
}: CtaProps) {
  return (
    <a
      href={siteConfig.booking.airbnbUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("click_reservation", { source: source ?? "generic" })}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {withIcon ? <CalendarCheck aria-hidden /> : null}
      {children}
    </a>
  );
}

/** Botão de WhatsApp com mensagem pré-preenchida. */
export function WhatsappButton({
  variant = "outline",
  size = "md",
  className,
  children = "Falar no WhatsApp",
  withIcon = true,
  source,
  message,
}: CtaProps & { message?: string }) {
  return (
    <a
      href={buildWhatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("click_whatsapp", { source: source ?? "generic" })}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {withIcon ? <MessageCircle aria-hidden /> : null}
      {children}
    </a>
  );
}

/** Botão de telefone. */
export function PhoneButton({
  variant = "ghost",
  size = "md",
  className,
  children = siteConfig.contact.phoneDisplay,
  withIcon = true,
  source,
}: CtaProps) {
  return (
    <a
      href={buildPhoneUrl()}
      onClick={() => track("click_phone", { source: source ?? "generic" })}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {withIcon ? <Phone aria-hidden /> : null}
      {children}
    </a>
  );
}
