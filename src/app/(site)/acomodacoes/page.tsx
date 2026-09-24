import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Accommodations } from "@/components/sections/accommodations";
import { Amenities } from "@/components/sections/amenities";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "A Pousada",
  description:
    "Conheça a Casa da Nete: pousada em Monte Alto, Arraial do Cabo, com suítes confortáveis, café da manhã caprichado e o Espaço Aconchego — a 30 passos da praia.",
  alternates: { canonical: "/acomodacoes" },
};

export default function AcomodacoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="A pousada"
        title="Suítes confortáveis, pertinho do mar"
        description="Escolha a suíte ideal para o seu grupo e aproveite o café da manhã e a área de lazer da pousada."
      />
      <Accommodations withHeading={false} />
      <Amenities />
      <CtaBand />
    </>
  );
}
