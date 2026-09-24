import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { LegalNotice } from "@/components/legal/legal-notice";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do site da Casa da Nete.",
  alternates: { canonical: "/termos" },
  robots: { index: false, follow: true },
};

export default function TermosPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Termos de Uso" />
      <section className="py-14 sm:py-16">
        <Container className="max-w-3xl">
          <LegalNotice />

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-2">
            <p>Última atualização: {/* TODO_CLIENTE */} __ / __ / ____</p>

            <div>
              <h2>1. Sobre este site</h2>
              <p>
                Este site tem caráter informativo e apresenta a {siteConfig.name},
                casa de temporada localizada em {siteConfig.location.city} —{" "}
                {siteConfig.location.state}. Ao navegar, você concorda com estes
                termos.
              </p>
            </div>

            <div>
              <h2>2. Reservas e pagamentos</h2>
              <p>
                As reservas são realizadas diretamente com a pousada pelo
                WhatsApp. Os valores, a disponibilidade, as condições de
                pagamento e as políticas de cancelamento são informados e
                confirmados com a gente no momento da reserva.
              </p>
            </div>

            <div>
              <h2>3. Uso do site</h2>
              <p>
                Você concorda em utilizar o site de forma lícita, sem prejudicar
                seu funcionamento ou os direitos de terceiros.
              </p>
            </div>

            <div>
              <h2>4. Conteúdo e imagens</h2>
              <p>
                Textos e imagens têm finalidade ilustrativa. As imagens podem ser
                substituídas pelas versões oficiais cedidas pelo proprietário. É
                vedada a reprodução sem autorização.
              </p>
            </div>

            <div>
              <h2>5. Limitação de responsabilidade</h2>
              <p>
                Empregamos esforços para manter as informações atualizadas, mas
                não garantimos que estejam livres de imprecisões. Confirme sempre
                os detalhes no momento da reserva.
              </p>
            </div>

            <div>
              <h2>6. Contato</h2>
              <p>
                Dúvidas sobre estes termos podem ser encaminhadas para{" "}
                {siteConfig.contact.email}.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
