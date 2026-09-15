import Image from "next/image";
import { Bath, BedDouble, Check, Home, Users } from "lucide-react";
import { accommodations } from "@/data/accommodations";
import type { Accommodation } from "@/types";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { ReserveButton, WhatsappButton } from "@/components/cta";

function CapacityBadges({ capacity }: { capacity: Accommodation["capacity"] }) {
  const items = [
    { icon: Users, label: `${capacity.guests} hóspedes` },
    { icon: Home, label: `${capacity.bedrooms} quartos` },
    { icon: BedDouble, label: `${capacity.beds} camas` },
    { icon: Bath, label: `${capacity.bathrooms} banheiros` },
  ];
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.label}>
          <Badge>
            <item.icon className="size-3.5 text-accent" aria-hidden />
            {item.label}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function Feature({
  accommodation,
  reversed,
}: {
  accommodation: Accommodation;
  reversed?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={reversed ? "lg:order-2" : ""}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[var(--shadow-lift)]">
          <Image
            src={accommodation.image.src}
            alt={accommodation.image.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </Reveal>

      <Reveal delay={100} className={reversed ? "lg:order-1" : ""}>
        <h3 className="text-3xl sm:text-4xl">{accommodation.name}</h3>
        <p className="mt-3 text-lg text-muted-foreground">
          {accommodation.summary}
        </p>

        <div className="mt-5">
          <CapacityBadges capacity={accommodation.capacity} />
        </div>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          {accommodation.description.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>

        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {accommodation.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
              {h}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ReserveButton source="accommodations" />
          <WhatsappButton source="accommodations" />
        </div>
      </Reveal>
    </div>
  );
}

export function Accommodations({ withHeading = true }: { withHeading?: boolean }) {
  return (
    <section id="acomodacoes" className="scroll-mt-24 py-24 sm:py-28">
      <Container>
        {withHeading ? (
          <SectionHeading
            align="center"
            eyebrow="A acomodação"
            title="A casa inteira, só para o seu grupo"
            description="Privacidade e conforto do começo ao fim da sua estadia."
            className="mx-auto mb-16"
          />
        ) : null}

        <div className="space-y-20">
          {accommodations.map((accommodation, i) => (
            <Feature
              key={accommodation.slug}
              accommodation={accommodation}
              reversed={i % 2 === 1}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
