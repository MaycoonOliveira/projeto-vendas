import { Plus } from "lucide-react";
import { faqItems } from "@/data/faq";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function Faq() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-28">
      <Container className="max-w-3xl">
        <SectionHeading
          align="center"
          eyebrow="Dúvidas frequentes"
          title="Tudo o que você precisa saber"
          className="mx-auto mb-12"
        />

        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {faqItems.map((item) => (
            <details key={item.question} className="group px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  className="size-5 shrink-0 text-accent transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
}
