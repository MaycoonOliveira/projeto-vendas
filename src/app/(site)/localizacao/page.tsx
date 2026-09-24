import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Location } from "@/components/sections/location";
import { CtaBand } from "@/components/sections/cta-band";

export const metadata: Metadata = {
  title: "Localização",
  description:
    "A Casa da Nete fica em Monte Alto, Arraial do Cabo (RJ), a 30 passos da praia de Massambaba e pertinho das praias e passeios mais procurados da cidade.",
  alternates: { canonical: "/localizacao" },
};

export default function LocalizacaoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Localização"
        title="Pertinho da praia, em Monte Alto"
        description="Em Arraial do Cabo, a 30 passos da praia de Massambaba e das praias mais bonitas da Região dos Lagos."
      />
      <Location />
      <CtaBand />
    </>
  );
}
