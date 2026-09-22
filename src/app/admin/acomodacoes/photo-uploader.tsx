"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImagePlus, X } from "lucide-react";

import { addPhotosAction } from "./actions";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";

type Preview = { key: string; url: string; name: string };

/** Barra de envio (fica embaixo). `useFormStatus` dá o estado de "enviando". */
function SubmitBar({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
      <span className="text-xs text-foreground/50">
        {count === 0
          ? "Nenhuma imagem selecionada"
          : `${count} imagem${count > 1 ? "ns" : ""} selecionada${count > 1 ? "s" : ""}`}
      </span>
      <button
        type="submit"
        disabled={pending || count === 0}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Enviando…" : count > 1 ? `Enviar ${count} fotos` : "Enviar foto"}
      </button>
    </div>
  );
}

/**
 * Upload de fotos da acomodação (Fase 18): seleciona VÁRIAS imagens, mostra a PRÉVIA de cada uma
 * antes de salvar, permite remover da seleção, e o botão de envio fica EMBAIXO. Sem opção por URL.
 */
export function PhotoUploader({ accommodationId }: { accommodationId: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);

  // Reconstrói o FileList do input para submeter exatamente a seleção atual (permite remover itens).
  function syncInput(next: File[]) {
    const dt = new DataTransfer();
    for (const f of next) dt.items.add(f);
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const merged = [...files];
    const newPreviews: Preview[] = [];
    for (const f of Array.from(list)) {
      if (merged.some((m) => m.name === f.name && m.size === f.size)) continue; // dedupe
      merged.push(f);
      newPreviews.push({
        key: `${f.name}-${f.size}-${f.lastModified}`,
        url: URL.createObjectURL(f),
        name: f.name,
      });
    }
    syncInput(merged);
    setFiles(merged);
    if (newPreviews.length) setPreviews((p) => [...p, ...newPreviews]);
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    syncInput(next);
    setFiles(next);
    setPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <form
      action={addPhotosAction}
      onSubmit={() => previews.forEach((p) => URL.revokeObjectURL(p.url))}
      className="mt-4 rounded-xl border border-border bg-white p-4"
    >
      <input type="hidden" name="accommodationId" value={accommodationId} />

      <label
        htmlFor="file"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-foreground/15 bg-muted/40 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <ImagePlus className="size-7 text-foreground/40" aria-hidden />
        <span className="text-sm font-medium text-foreground">
          Clique para escolher as imagens
        </span>
        <span className="text-xs text-foreground/50">
          JPG, PNG, WEBP, AVIF ou GIF · até 6MB cada · pode selecionar várias
        </span>
      </label>
      <input
        ref={inputRef}
        id="file"
        name="file"
        type="file"
        multiple
        accept={ACCEPT}
        onChange={(e) => addFiles(e.target.files)}
        className="sr-only"
      />

      {previews.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {previews.map((p, i) => (
            <li
              key={p.key}
              className="group relative overflow-hidden rounded-xl border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className="aspect-[4/3] w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remover ${p.name}`}
                className="absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-foreground/70 shadow-sm transition-colors hover:bg-white hover:text-red-600"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <SubmitBar count={previews.length} />
    </form>
  );
}
