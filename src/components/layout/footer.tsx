import Link from "next/link";
import { AtSign, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ReserveButton, WhatsappButton } from "@/components/cta";
import { buildPhoneUrl } from "@/lib/whatsapp";

const legalLinks = [
  { label: "Termos de uso", href: "/termos" },
  { label: "Política de Privacidade", href: "/politica-de-privacidade" },
];

export function Footer() {
  const year = new Date().getFullYear();
  const { location, contact, socials } = siteConfig;

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div className="lg:col-span-2">
            <p className="font-display text-2xl">{siteConfig.name}</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Refúgio contemporâneo em {location.city}, na{" "}
              {location.region}. Piscina, deck e Mata Atlântica para você
              desacelerar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ReserveButton size="sm" source="footer" />
              <WhatsappButton size="sm" source="footer" />
            </div>
          </div>

          {/* Navegação */}
          <nav aria-label="Rodapé — navegação">
            <h2 className="text-sm font-semibold text-foreground">Navegação</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contato */}
          <div>
            <h2 className="text-sm font-semibold text-foreground">Contato</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span>
                  {location.city} — {location.state}
                  <br />
                  {location.region}
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-accent" aria-hidden />
                <a
                  href={buildPhoneUrl()}
                  className="transition-colors hover:text-foreground"
                >
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-accent" aria-hidden />
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {contact.email}
                </a>
              </li>
              {socials.instagram ? (
                <li className="flex items-center gap-2.5">
                  <AtSign className="size-4 shrink-0 text-accent" aria-hidden />
                  <a
                    href={socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. Todos os direitos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
