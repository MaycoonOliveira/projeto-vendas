import { differentials } from "@/data/differentials";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function Differentials() {
  return (
    <section className="bg-muted py-24 sm:py-28">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Por que a Casa da Nete"
          title="Feita para momentos que ficam na memória"
          description="Cada detalhe pensado para o seu descanso — do design da casa à paisagem que a cerca."
          className="mx-auto"
        />

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {differentials.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 80}
              className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-soft)]"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
