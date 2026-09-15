"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryImage } from "@/types";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** Padrão de "mosaico" para dar ritmo ao grid sem deformar as imagens. */
function spanFor(index: number) {
  const m = index % 6;
  if (m === 0) return "col-span-2 row-span-2";
  if (m === 3) return "md:row-span-2";
  return "";
}

export function GalleryLightbox({
  images,
  className,
}: {
  images: GalleryImage[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const open = useCallback((index: number) => {
    setOpenIndex(index);
    track("gallery_open", { index });
  }, []);
  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length],
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, prev, next]);

  const current = openIndex !== null ? images[openIndex] : null;

  return (
    <>
      <ul
        className={cn(
          "grid grid-cols-2 gap-3 [grid-auto-rows:9rem] sm:[grid-auto-rows:11rem] md:grid-cols-4 md:[grid-auto-rows:13rem]",
          className,
        )}
      >
        {images.map((image, index) => (
          <li key={image.src} className={cn("min-w-0", spanFor(index))}>
            <button
              type="button"
              onClick={() => open(index)}
              aria-label={`Ampliar imagem: ${image.alt}`}
              className="group relative block h-full w-full overflow-hidden rounded-xl bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span className="absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover:bg-foreground/10" />
            </button>
          </li>
        ))}
      </ul>

      {isOpen && current ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagem ${openIndex! + 1} de ${images.length}`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 p-4"
          onClick={close}
        >
          {/* Contador */}
          <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
            {openIndex! + 1} / {images.length}
          </div>

          {/* Fechar */}
          <button
            type="button"
            onClick={close}
            aria-label="Fechar galeria"
            className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="size-6" aria-hidden />
          </button>

          {/* Anterior */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Imagem anterior"
            className="absolute left-3 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white sm:left-6"
          >
            <ChevronLeft className="size-7" aria-hidden />
          </button>

          {/* Imagem */}
          <figure
            className="relative flex max-h-[86vh] w-full max-w-6xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[74vh] w-full">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                sizes="92vw"
                className="object-contain"
                priority
              />
            </div>
            <figcaption className="mt-4 max-w-2xl text-center text-sm text-white/80">
              {current.alt}
            </figcaption>
          </figure>

          {/* Próxima */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Próxima imagem"
            className="absolute right-3 top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white sm:right-6"
          >
            <ChevronRight className="size-7" aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  );
}
