import Image from "next/image";
import { siteConfig } from "@/config/site";
import { galleryImages } from "@/data/gallery";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const stats = [
  { value: `${siteConfig.property.guests}`, label: "Hóspedes" },
  { value: `${siteConfig.property.bedrooms}`, label: "Quartos" },
  { value: siteConfig.property.bathrooms, label: "Banheiros" },
  {
    value: siteConfig.reviews.rating.toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
    }),
    label: `no ${siteConfig.reviews.source}`,
  },
];

export function About() {
  return (
    <section id="a-casa" className="scroll-mt-24 py-24 sm:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Texto */}
          <Reveal className="order-2 lg:order-1">
            <span className="eyebrow">A Casa da Nete</span>
            <h2 className="mt-4 text-3xl leading-[1.1] sm:text-4xl lg:text-[2.75rem]">
              Aconchego pertinho do mar, em Arraial do Cabo
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Em Monte Alto, {siteConfig.location.city}, a Casa da Nete foi
                pensada para quem quer descansar com o mar logo ali. Suítes
                confortáveis, café da manhã caprichado e um clima de casa criam a
                atmosfera perfeita para recarregar as energias.
              </p>
              <p>
                O Espaço Aconchego reúne redes, jogos para a família, lareira e
                churrasqueira — e a praia de Massambaba fica a apenas 30 passos,
                para um dia de sol e mergulho.
              </p>
            </div>

            {/* Números reais */}
            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-3xl text-primary">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          {/* Imagem */}
          <Reveal delay={100} className="order-1 lg:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[var(--shadow-lift)] sm:aspect-[5/6]">
              <Image
                src={galleryImages[2].src}
                alt={galleryImages[2].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
