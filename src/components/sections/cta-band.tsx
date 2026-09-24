import Image from "next/image";
import { galleryImages } from "@/data/gallery";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { ReserveButton, WhatsappButton } from "@/components/cta";

export function CtaBand() {
  const bg = galleryImages[3]; // deck sob o toldo, com vista

  return (
    <section className="relative overflow-hidden">
      <Image
        src={bg.src}
        alt={bg.alt}
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div aria-hidden className="absolute inset-0 bg-primary/80" />

      <Container className="relative z-10 py-24 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl leading-tight text-primary-foreground sm:text-4xl lg:text-5xl">
            Pronto para acordar pertinho do mar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/85">
            Consulte as datas disponíveis e garanta a sua estadia na Casa da Nete.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ReserveButton size="lg" variant="light" source="cta-band" />
            <WhatsappButton
              size="lg"
              variant="outlineLight"
              source="cta-band"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
