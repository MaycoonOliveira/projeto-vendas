import { galleryImages } from "@/data/gallery";
import type { Accommodation } from "@/types";

/**
 * A Casa Carram é alugada como casa inteira (não por quartos). Apresentamos
 * uma única "acomodação" com os números CONFIRMADOS. A estrutura é um array
 * para permitir novas unidades no futuro sem mudar os componentes.
 *
 * Não inventamos distribuição de camas por quarto nem metragem (não divulgadas).
 */
export const accommodations: Accommodation[] = [
  {
    slug: "casa-carram",
    name: "A Casa Carram",
    summary:
      "Casa inteira e exclusiva para você e seus convidados, em meio à serra de Petrópolis.",
    description: [
      "A Casa Carram é um refúgio contemporâneo pensado para desacelerar. Ambientes integrados, muita luz natural e uma decoração leve criam a atmosfera perfeita para um fim de semana especial.",
      "Do lado de fora, a piscina, o deck de madeira e a hidromassagem se abrem para o verde da Mata Atlântica — o cenário ideal para um dia de sol ou uma noite tranquila sob o céu da serra.",
      "Você tem a casa inteira só para o seu grupo: cozinha equipada, churrasqueira, Wi-Fi e estacionamento gratuito no local.",
    ],
    image: galleryImages[6],
    capacity: {
      guests: 4,
      bedrooms: 2,
      beds: 3,
      bathrooms: "2,5",
    },
    highlights: [
      "Casa inteira e privativa",
      "Piscina, deck e hidromassagem",
      "Cozinha equipada e churrasqueira",
      "Vista para a serra e Mata Atlântica",
    ],
  },
];

export const primaryAccommodation = accommodations[0];
