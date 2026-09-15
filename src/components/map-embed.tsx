"use client";

import { useState } from "react";
import { MapPin, Play } from "lucide-react";

/**
 * Mapa com "click-to-load": o iframe do Google Maps só é carregado após a
 * interação do usuário. Isso melhora a performance (LCP) e a privacidade,
 * evitando requisições a terceiros no carregamento inicial da página.
 */
export function MapEmbed({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        src={src}
        title={label}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`Carregar ${label}`}
      className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-primary/5 text-foreground transition-colors hover:bg-primary/10"
    >
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-surface text-primary shadow-[var(--shadow-soft)] transition-transform group-hover:scale-105">
        <MapPin className="size-7" aria-hidden />
      </span>
      <span className="flex items-center gap-2 text-sm font-medium">
        <Play className="size-4 text-accent" aria-hidden />
        Carregar mapa da região
      </span>
    </button>
  );
}
