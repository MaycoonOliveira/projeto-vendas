import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { LegalNotice } from "@/components/legal/legal-notice";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de privacidade e tratamento de dados da Casa da Nete.",
  alternates: { canonical: "/politica-de-privacidade" },
  robots: { index: false, follow: true },
};

export default function PrivacidadePage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Política de Privacidade" />
      <section className="py-14 sm:py-16">
        <Container className="max-w-3xl">
          <LegalNotice />

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:mt-2">
            <p>Última atualização: {/* TODO_CLIENTE */} __ / __ / ____</p>

            <div>
              <h2>1. Introdução</h2>
              <p>
                Esta política descreve, de forma transparente, como tratamos
                informações no site da {siteConfig.name}, em conformidade com a
                Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
              </p>
            </div>

            <div>
              <h2>2. Dados que coletamos</h2>
              <p>
                Este site é institucional e não possui cadastro nem área
                logada. Você pode nos enviar dados voluntariamente ao entrar em
                contato por WhatsApp, telefone ou e-mail (por exemplo, nome e
                informações sobre a sua reserva).
              </p>
            </div>

            <div>
              <h2>3. Cookies e métricas</h2>
              <p>
                Por padrão, nenhuma ferramenta de rastreamento é ativada. Caso o
                proprietário passe a utilizar métricas (por exemplo, Google
                Analytics), esta política será atualizada para detalhar os dados
                coletados e as finalidades.
              </p>
            </div>

            <div>
              <h2>4. Uso das informações</h2>
              <p>
                Utilizamos os dados enviados apenas para responder ao seu contato
                e viabilizar a sua reserva. Não vendemos suas informações.
              </p>
            </div>

            <div>
              <h2>5. Compartilhamento</h2>
              <p>
                O atendimento e as reservas feitas pelo WhatsApp seguem também a
                política de privacidade do próprio aplicativo.
              </p>
            </div>

            <div>
              <h2>6. Seus direitos</h2>
              <p>
                Você pode solicitar acesso, correção ou exclusão dos seus dados,
                bem como esclarecimentos sobre o tratamento, entrando em contato
                pelos canais oficiais.
              </p>
            </div>

            <div>
              <h2>7. Contato do responsável</h2>
              <p>
                Para exercer seus direitos ou tirar dúvidas, escreva para{" "}
                {siteConfig.contact.email}.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
