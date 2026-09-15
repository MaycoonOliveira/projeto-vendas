import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { galleryImages } from "@/data/gallery";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GalleryPreview() {
  const preview = galleryImages.slice(0, 7);

  return (
    <section className="bg-muted py-24 sm:py-28">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Galeria"
            title="Um convite ao olhar"
            description="Passeie pelos ambientes e pela paisagem que cercam a Casa Carram."
          />
          <Link
            href="/galeria"
            className={cn(
              buttonVariants({ variant: "outline", size: "md" }),
              "shrink-0",
            )}
          >
            Ver galeria completa
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <GalleryLightbox images={preview} className="mt-12" />
      </Container>
    </section>
  );
}
