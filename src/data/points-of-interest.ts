import type { PointOfInterest } from "@/types";

/**
 * Pontos de interesse em Arraial do Cabo (praias e passeios conhecidos da
 * cidade), citados no site oficial da Casa da Nete.
 *
 * NÃO informamos distâncias nem tempos de deslocamento (não confirmados).
 * TODO_CLIENTE: se desejar, acrescente distâncias reais a partir da pousada.
 */
export const pointsOfInterest: PointOfInterest[] = [
  {
    name: "Praia de Massambaba",
    description:
      "A praia mais próxima — a apenas 30 passos da pousada, com faixa de areia extensa.",
  },
  {
    name: "Prainha",
    description:
      "Uma das praias mais famosas de Arraial do Cabo, de águas cristalinas.",
  },
  {
    name: "Praia do Forno & Praia dos Anjos",
    description:
      "Enseadas paradisíacas, ponto de partida dos passeios de barco pela região.",
  },
  {
    name: "Pontal do Atalaia",
    description:
      "Mirante com uma das vistas mais bonitas do litoral fluminense.",
  },
  {
    name: "Passeio de barco",
    description:
      "Roteiro clássico pelas grutas, ilhas e praias só acessíveis pelo mar.",
  },
];
