import Image from "next/image";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Identidade visual da Casa da Nete — ponto único da marca na interface.
 *
 * - <BrandMark>: selo compacto (sol + casa), nas cores da marca. Ideal para
 *   cabeçalhos e favicons — legível em tamanhos pequenos.
 * - <BrandLockup>: selo + nome em Fraunces. Usado em navbars e no header do admin.
 * - <BrandLogoImage>: o logotipo oficial completo (arquivo do cliente), para
 *   telas com mais espaço (login, rodapé).
 *
 * Motivo do desenho e paleta: extraídos de casadanete.com.br.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-9", className)}
      role="img"
      aria-label={siteConfig.name}
    >
      <rect width="64" height="64" rx="14" fill="var(--color-primary)" />
      <circle cx="24" cy="24" r="8" fill="var(--color-accent)" />
      <path
        d="M18 44 L32 32 L46 44 Z"
        fill="none"
        stroke="var(--color-primary-foreground)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <rect
        x="22"
        y="43"
        width="20"
        height="9"
        rx="1.5"
        fill="none"
        stroke="var(--color-primary-foreground)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLockup({
  className,
  markClassName,
  subtitle,
}: {
  className?: string;
  markClassName?: string;
  /** Texto opcional à direita do nome (ex.: "Admin"). */
  subtitle?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      <span className="inline-flex items-baseline gap-2">
        <span className="font-display text-lg leading-none font-medium tracking-tight text-foreground">
          {siteConfig.name}
        </span>
        {subtitle ? (
          <span className="text-sm font-medium text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function BrandLogoImage({
  className,
  width = 200,
  height = 200,
  priority,
}: {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo.jpg"
      alt={`Logotipo da ${siteConfig.legalName}`}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto", className)}
    />
  );
}
