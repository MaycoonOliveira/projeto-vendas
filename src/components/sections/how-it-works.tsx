import { CalendarDays, ClipboardCheck, MessageCircle } from "lucide-react";

import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { ReserveButton } from "@/components/cta";

const STEPS = [
  {
    icon: CalendarDays,
    title: "1. Escolha as datas",
    description:
      "Veja no calendário as noites livres, selecione o período e o número de hóspedes. O valor aparece na hora, calculado automaticamente.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Solicite a reserva",
    description:
      "Informe seus dados de contato. A reserva fica pendente por até 24h enquanto confirmamos — sem pedir dados de cartão no site.",
  },
  {
    icon: MessageCircle,
    title: "3. Confirmação",
    description:
      "Combinamos o pagamento por WhatsApp ou PIX e confirmamos a sua estadia. Você recebe o código da reserva por e-mail.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="py-24 sm:py-28">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Reserva direta, sem intermediários"
          title="Como funciona"
          description="Reservar na Casa da Nete é simples e transparente — em três passos."
          className="mx-auto"
        />

        <ol className="mt-14 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal
              key={step.title}
              as="li"
              delay={i * 80}
              className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-soft)]"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </Reveal>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <ReserveButton size="lg" source="how-it-works" />
        </div>
      </Container>
    </section>
  );
}
