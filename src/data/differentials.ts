import { Coffee, Sparkles, Umbrella, Waves } from "lucide-react";
import type { Differential } from "@/types";

/** Diferenciais — todos derivados de fatos confirmados da pousada. */
export const differentials: Differential[] = [
  {
    icon: Waves,
    title: "A 30 passos da praia",
    description:
      "O mar logo ali, sem precisar de carro: a praia de Massambaba fica pertinho da pousada.",
  },
  {
    icon: Coffee,
    title: "Café da manhã caprichado",
    description:
      "Combos para todos os gostos — de tapioca a cuscuz com bacon — servidos das 7h às 9h.",
  },
  {
    icon: Umbrella,
    title: "Espaço Aconchego",
    description:
      "Área de lazer com redes, totó, jogos, lareira e churrasqueira para toda a família.",
  },
  {
    icon: Sparkles,
    title: "Recomendada pelos hóspedes",
    description:
      "Suítes confortáveis, atendimento próximo e ótimas avaliações de quem já se hospedou.",
  },
];
