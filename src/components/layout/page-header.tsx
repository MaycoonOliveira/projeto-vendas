import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/** Cabeçalho padrão das páginas internas (já compensa a navbar fixa). */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <section className={cn("bg-muted pt-28 pb-14 sm:pt-32 sm:pb-16", className)}>
      <Container>
        <Reveal className="max-w-3xl">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h1 className="mt-3 text-4xl leading-[1.08] sm:text-5xl">{title}</h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </Reveal>
      </Container>
    </section>
  );
}
