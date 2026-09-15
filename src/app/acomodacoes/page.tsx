import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Accommodations } from "@/components/sections/accommodations";
import { Amenities } from "@/components/sections/amenities";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "A Casa",
  description:
    "Conheça a Casa Carram: casa inteira em Petrópolis para até 4 hóspedes, com piscina, deck, hidromassagem, cozinha equipada e churrasqueira.",
  alternates: { canonical: "/acomodacoes" },
};

export default function AcomodacoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="A acomodação"
        title="A casa inteira, só para o seu grupo"
        description="Privacidade, conforto e uma paisagem de tirar o fôlego do começo ao fim da estadia."
      />
      <Accommodations withHeading={false} />
      <Amenities />
      <CtaBand />
    </>
  );
}
