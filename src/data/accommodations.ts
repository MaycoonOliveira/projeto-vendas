import { galleryImages } from "@/data/gallery";
import type { Accommodation } from "@/types";

/**
 * A Casa da Nete é uma pousada com suítes (Nete, Vitor, Marreta, Loft Hugo e
 * Lavínia). Aqui apresentamos uma visão geral da pousada para o site público —
 * o inventário real e detalhado é gerenciado no painel administrativo.
 *
 * A estrutura é um array para permitir novas unidades sem mudar os componentes.
 * Capacidades totais são aproximadas (a confirmar).
 */
export const accommodations: Accommodation[] = [
  {
    // slug interno mantido (chave de rota/lógica) — não é texto de marca.
    slug: "casa-carram",
    name: "As suítes da Casa da Nete",
    summary:
      "Suítes confortáveis para casais, famílias e grupos, a 30 passos da praia de Massambaba.",
    description: [
      "A Casa da Nete é uma pousada acolhedora em Monte Alto, Arraial do Cabo. As suítes foram pensadas para diferentes grupos — da queridinha Suíte Nete, com rede privativa e vista parcial para o mar, à ampla Suíte Lavínia, com cozinha integrada.",
      "Algumas suítes têm cozinha (Loft Hugo e Lavínia) e a Suíte Marreta é térrea, pensada para receber bem quem precisa de mais acessibilidade.",
      "Todos os hóspedes contam com café da manhã caprichado e o Espaço Aconchego: redes, totó, jogos, lareira e churrasqueira para toda a família.",
    ],
    image: galleryImages[6],
    capacity: {
      guests: 24,
      bedrooms: 5,
      beds: 5,
      bathrooms: "5",
    },
    highlights: [
      "5 suítes para diferentes grupos",
      "A 30 passos da praia de Massambaba",
      "Café da manhã e Espaço Aconchego",
      "Suíte térrea com acessibilidade",
    ],
  },
];

export const primaryAccommodation = accommodations[0];
