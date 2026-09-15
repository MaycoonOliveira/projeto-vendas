import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import { heroImage } from "@/data/gallery";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { ReserveButton } from "@/components/cta";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative flex min-h-[92svh] items-end overflow-hidden">
      {/* Imagem de fundo */}
      <Image
        src={heroImage.src}
        alt={heroImage.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Camadas de contraste para o texto e a navbar */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/70"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"
      />

      <Container className="relative z-10 pb-16 pt-32 sm:pb-20 lg:pb-28">
        <div className="max-w-2xl">
          <p className="eyebrow text-accent-foreground/90 drop-shadow">
            {siteConfig.name} · {siteConfig.location.city}, {siteConfig.location.state}
          </p>

          <h1 className="mt-4 text-4xl leading-[1.05] text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            Uma casa para se apaixonar na serra de Petrópolis
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            Refúgio contemporâneo com piscina e vista para a Mata Atlântica.
            A casa inteira, só para você e seus convidados.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ReserveButton size="lg" variant="light" source="hero" />
            <Link
              href="/acomodacoes"
              className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }))}
            >
              Conhecer a casa
            </Link>
          </div>

          {/* Prova social */}
          <div className="mt-8 flex items-center gap-2 text-sm text-white/85">
            <Star className="size-4 fill-accent text-accent" aria-hidden />
            <span className="font-medium text-white">
              {siteConfig.reviews.rating.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
              })}
            </span>
            <span>
              · {siteConfig.reviews.badge} no {siteConfig.reviews.source}
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
