import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { CtaBand } from "@/components/sections/cta-band";
import { galleryImages } from "@/data/gallery";

export const metadata: Metadata = {
  title: "Galeria",
  description:
    "Fotos da Casa Carram em Petrópolis: arquitetura contemporânea, piscina, deck, área externa e a paisagem da serra.",
  alternates: { canonical: "/galeria" },
};

export default function GaleriaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Galeria"
        title="Cada detalhe, um convite"
        description="Explore os ambientes da casa e a natureza que a cerca. Toque em qualquer foto para ampliar."
      />
      <section className="py-16 sm:py-20">
        <Container>
          <GalleryLightbox images={galleryImages} />
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
