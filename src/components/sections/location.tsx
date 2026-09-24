import { MapPin, Navigation } from "lucide-react";
import { siteConfig } from "@/config/site";
import { pointsOfInterest } from "@/data/points-of-interest";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { MapEmbed } from "@/components/map-embed";
import { cn } from "@/lib/utils";

export function Location() {
  const { location } = siteConfig;

  return (
    <section id="localizacao" className="scroll-mt-24 bg-muted py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Onde estamos"
          title="Pertinho da praia, em Monte Alto"
          description={`A Casa da Nete fica em Monte Alto, ${location.city}, na ${location.region} — a 30 passos da praia de Massambaba.`}
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-5">
          {/* Mapa */}
          <Reveal className="lg:col-span-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-soft)] sm:aspect-video">
              <MapEmbed
                src={location.mapsEmbedSrc}
                label={`Mapa de ${location.city}`}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Mapa aproximado da região. {location.addressLine}.
            </p>
          </Reveal>

          {/* Info + pontos de interesse */}
          <Reveal delay={100} className="lg:col-span-2">
            <div className="rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <p className="font-semibold text-foreground">
                    {location.city} — {location.state}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {location.region}, {location.country}
                  </p>
                </div>
              </div>

              <a
                href={location.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-5",
                )}
              >
                <Navigation className="size-4" aria-hidden />
                Ver no Google Maps
              </a>

              <div className="mt-7 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-foreground">
                  Por perto, em Arraial do Cabo
                </h3>
                <ul className="mt-4 space-y-4">
                  {pointsOfInterest.map((poi) => (
                    <li key={poi.name}>
                      <p className="text-sm font-medium text-foreground">
                        {poi.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {poi.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
