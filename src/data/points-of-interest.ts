import type { PointOfInterest } from "@/types";

/**
 * Pontos de interesse em Petrópolis (marcos públicos e conhecidos da cidade).
 *
 * NÃO informamos distâncias nem tempos de deslocamento (não confirmados).
 * TODO_CLIENTE: se desejar, acrescente distâncias reais a partir da casa.
 */
export const pointsOfInterest: PointOfInterest[] = [
  {
    name: "Centro Histórico de Petrópolis",
    description:
      "A charmosa Cidade Imperial, com ruas arborizadas, cafés e arquitetura histórica.",
  },
  {
    name: "Museu Imperial",
    description:
      "Antigo palácio de verão de Dom Pedro II, um dos museus mais visitados do país.",
  },
  {
    name: "Catedral São Pedro de Alcântara",
    description:
      "Templo em estilo neogótico que guarda o mausoléu da família imperial.",
  },
  {
    name: "Palácio de Cristal",
    description:
      "Estrutura de ferro e vidro do século XIX, cercada por jardins.",
  },
  {
    name: "Mata Atlântica & trilhas",
    description:
      "Natureza exuberante da região serrana, com trilhas e mirantes.",
  },
];
