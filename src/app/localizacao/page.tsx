import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Location } from "@/components/sections/location";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Localização",
  description:
    "A Casa Carram fica em Petrópolis, na região serrana do Rio de Janeiro, cercada pela Mata Atlântica e perto do centro histórico.",
  alternates: { canonical: "/localizacao" },
};

export default function LocalizacaoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Localização"
        title="Na serra fluminense, cercada de natureza"
        description="Petrópolis une o charme da Cidade Imperial ao verde da Mata Atlântica."
      />
      <Location />
      <CtaBand />
    </>
  );
}
