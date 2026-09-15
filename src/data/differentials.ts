import { Leaf, Mountain, Sparkles, Waves } from "lucide-react";
import type { Differential } from "@/types";

/** Diferenciais — todos derivados de fatos confirmados da propriedade. */
export const differentials: Differential[] = [
  {
    icon: Sparkles,
    title: "Arquitetura para se apaixonar",
    description:
      "Design contemporâneo, linhas limpas e ambientes integrados que convidam ao descanso.",
  },
  {
    icon: Waves,
    title: "Piscina & deck com vista",
    description:
      "Piscina ao ar livre, deck de madeira e hidromassagem para aproveitar o sol da serra.",
  },
  {
    icon: Leaf,
    title: "Imersa na Mata Atlântica",
    description:
      "Cercada pelo verde de Petrópolis, na região serrana do Rio de Janeiro.",
  },
  {
    icon: Mountain,
    title: "Favorito dos hóspedes",
    description:
      "Avaliação 5,0 no Airbnb e o selo de Favorito dos hóspedes já na estreia.",
  },
];
