import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { CtaBand } from "@/components/sections/cta-band";
import { galleryImages } from "@/data/gallery";

export const metadata: Metadata = {
  title: "Galeria",
  description:
    "Fotos da Casa da Nete em Arraial do Cabo: fachada, suítes, Espaço Aconchego e o café da manhã da pousada.",
  alternates: { canonical: "/galeria" },
};

export default function GaleriaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Galeria"
        title="Cada detalhe, um convite"
        description="Explore as suítes, a área de lazer e o café da manhã da pousada. Toque em qualquer foto para ampliar."
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
