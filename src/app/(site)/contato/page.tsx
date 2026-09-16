import type { Metadata } from "next";
import { CalendarCheck, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { ReserveButton, WhatsappButton } from "@/components/cta";
import { siteConfig } from "@/config/site";
import { buildPhoneUrl, buildWhatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a Casa Carram pelo WhatsApp, telefone ou e-mail e reserve sua estadia em Petrópolis.",
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  const { contact, location } = siteConfig;

  const channels = [
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: "Resposta rápida",
      href: buildWhatsappUrl(),
      external: true,
    },
    {
      icon: Phone,
      title: "Telefone",
      value: contact.phoneDisplay,
      href: buildPhoneUrl(),
      external: false,
    },
    {
      icon: Mail,
      title: "E-mail",
      value: contact.email,
      href: `mailto:${contact.email}`,
      external: false,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Vamos planejar a sua estadia"
        description="Tire dúvidas sobre datas, valores e detalhes da casa. Estamos por aqui para ajudar."
      />

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {channels.map((c, i) => (
              <Reveal
                key={c.title}
                delay={i * 80}
                className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-7 shadow-[var(--shadow-soft)]"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <c.icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {c.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{c.value}</p>
                </div>
                <a
                  href={c.href}
                  target={c.external ? "_blank" : undefined}
                  rel={c.external ? "noopener noreferrer" : undefined}
                  className="mt-auto text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Abrir {c.title}
                </a>
              </Reveal>
            ))}
          </div>

          {/* Bloco de reserva */}
          <Reveal className="mt-10 overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground sm:p-12">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
                  <CalendarCheck className="size-4" aria-hidden />
                  Reserva
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl">
                  Consulte disponibilidade e reserve
                </h2>
                <p className="mt-2 text-primary-foreground/80">
                  A reserva é feita com segurança pelo anúncio oficial no Airbnb.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <ReserveButton size="lg" variant="light" source="contato" />
                <WhatsappButton
                  size="lg"
                  variant="outlineLight"
                  source="contato"
                />
              </div>
            </div>
          </Reveal>

          {/* Localização resumida */}
          <Reveal className="mt-10 flex items-start gap-3 rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <p>
              <span className="font-medium text-foreground">
                {location.city} — {location.state}
              </span>
              , {location.region}. {location.addressLine}.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
