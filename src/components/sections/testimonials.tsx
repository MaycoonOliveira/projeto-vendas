import { Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import { testimonials } from "@/data/testimonials";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Testimonials() {
  const { reviews } = siteConfig;

  return (
    <section className="py-24 sm:py-28">
      <Container>
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="flex items-center gap-1" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-6 fill-accent text-accent" />
            ))}
          </div>
          <p className="mt-5 font-display text-4xl text-foreground sm:text-5xl">
            {reviews.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
            <span className="text-muted-foreground"> / 5</span>
          </p>
          <p className="mt-3 text-lg text-foreground">
            {reviews.badge} no {reviews.source}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Baseado em {reviews.count} avaliações de hóspedes.
          </p>
          <a
            href={reviews.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "md" }), "mt-7")}
          >
            Ver avaliações no {reviews.source}
          </a>
        </Reveal>

        {testimonials.length > 0 ? (
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal
                key={t.author + i}
                delay={i * 80}
                className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-soft)]"
              >
                <div className="flex gap-0.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-4 fill-accent text-accent" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground">
                  “{t.quote}”
                </blockquote>
                <footer className="mt-5 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{t.author}</span>
                  {t.context ? ` · ${t.context}` : null}
                </footer>
              </Reveal>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
