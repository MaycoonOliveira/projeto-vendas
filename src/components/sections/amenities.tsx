import { amenities, experiences } from "@/data/amenities";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function Amenities() {
  return (
    <section id="comodidades" className="scroll-mt-24 py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Comodidades"
          title="Tudo pronto para você aproveitar"
          description="A estrutura da casa e os serviços disponíveis para tornar a sua estadia completa."
        />

        {/* Comodidades da casa */}
        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {amenities.map((item, i) => (
            <Reveal
              key={item.label}
              delay={(i % 4) * 60}
              className="flex flex-col gap-3"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-base font-semibold text-foreground">
                {item.label}
              </h3>
              {item.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </Reveal>
          ))}
        </div>

        {/* Experiências / serviços */}
        <Reveal className="mt-16 rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-soft)] sm:p-10">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Experiências &amp; serviços</span>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Disponíveis mediante consulta e sujeitos a disponibilidade —
              alguns podem ter custo adicional.
            </p>
          </div>
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <item.icon className="size-[1.125rem]" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
