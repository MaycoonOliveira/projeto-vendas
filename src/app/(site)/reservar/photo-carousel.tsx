"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";

export type GalleryPhoto = { url: string; alt: string | null };

/**
 * Galeria de fotos da acomodação no site público (Fase 18) — estilo Airbnb/Booking:
 * imagem principal em destaque, setas + indicadores (dots) para navegar, contador,
 * e um lightbox em tela cheia (com miniaturas) para ver todas as fotos.
 *
 * Sem `next/image` de propósito: as URLs vêm do Supabase Storage (domínio dinâmico por
 * projeto) e são exibidas com `<img>` simples para evitar configuração de domínios.
 */
export function PhotoCarousel({
  photos,
  name,
  aspect = "aspect-[16/10]",
}: {
  photos: GalleryPhoto[];
  name: string;
  aspect?: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = photos.length;

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count],
  );

  if (count === 0) {
    return (
      <div
        className={`flex ${aspect} w-full items-center justify-center bg-muted text-foreground/30`}
        aria-hidden
      >
        <ImageOff className="size-8" />
      </div>
    );
  }

  const current = photos[Math.min(index, count - 1)];

  return (
    <>
      <div className={`group relative ${aspect} w-full overflow-hidden bg-muted`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? name}
          loading="lazy"
          onClick={() => setLightbox(true)}
          className="size-full cursor-zoom-in object-cover transition-opacity"
        />

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-foreground shadow-sm backdrop-blur transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>

            {/* Dots */}
            <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para a foto ${i + 1}`}
                  aria-current={i === index}
                  className={`size-1.5 rounded-full transition-all ${
                    i === index ? "w-4 bg-white" : "bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            {/* Contador */}
            <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
              {index + 1}/{count}
            </span>
          </>
        ) : null}
      </div>

      {lightbox ? (
        <Lightbox
          photos={photos}
          name={name}
          index={index}
          setIndex={setIndex}
          onClose={() => setLightbox(false)}
        />
      ) : null}
    </>
  );
}

function Lightbox({
  photos,
  name,
  index,
  setIndex,
  onClose,
}: {
  photos: GalleryPhoto[];
  name: string;
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
}) {
  const count = photos.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((index - 1 + count) % count);
      if (e.key === "ArrowRight") setIndex((index + 1) % count);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, count, onClose, setIndex]);

  const current = photos[Math.min(index, count - 1)];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos — ${name}`}
      className="fixed inset-0 z-[80] flex flex-col bg-black/92 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-medium">
          {index + 1} / {count} — {name}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar galeria"
          className="inline-flex size-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-6" aria-hidden />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? name}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setIndex((index - 1 + count) % count)}
              aria-label="Foto anterior"
              className="absolute left-3 inline-flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              <ChevronLeft className="size-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setIndex((index + 1) % count)}
              aria-label="Próxima foto"
              className="absolute right-3 inline-flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              <ChevronRight className="size-6" aria-hidden />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === index ? "ring-white" : "ring-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
