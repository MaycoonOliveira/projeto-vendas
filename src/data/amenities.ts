import {
  Bath,
  Car,
  Coffee,
  Flame,
  Footprints,
  Mountain,
  Plane,
  Sparkles,
  TreePine,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import type { Amenity } from "@/types";

/**
 * Comodidades CONFIRMADAS no anúncio e/ou visíveis nas fotos.
 * Não adicione itens não confirmados. Ver docs/content.md.
 */
export const amenities: Amenity[] = [
  {
    icon: Waves,
    label: "Piscina",
    description: "Piscina ao ar livre com deck e vista para a natureza.",
  },
  {
    icon: Bath,
    label: "Hidromassagem",
    description: "Área de hidromassagem para relaxar.",
  },
  {
    icon: Wifi,
    label: "Wi-Fi",
    description: "Internet sem fio disponível na casa.",
  },
  {
    icon: Car,
    label: "Estacionamento gratuito",
    description: "Vagas gratuitas no local.",
  },
  {
    icon: UtensilsCrossed,
    label: "Cozinha equipada",
    description: "Cozinha completa para preparar suas refeições.",
  },
  {
    icon: Flame,
    label: "Churrasqueira",
    description: "Espaço para churrasco ao ar livre.",
  },
  {
    icon: TreePine,
    label: "Área externa",
    description: "Deck e jardim cercados pela Mata Atlântica.",
  },
  {
    icon: Mountain,
    label: "Vista para a serra",
    description: "Paisagem de montanha em Petrópolis.",
  },
];

/**
 * Serviços e experiências oferecidos MEDIANTE CONSULTA (listados no anúncio).
 * Deixe claro que dependem de disponibilidade e podem ter custo adicional.
 */
export const experiences: Amenity[] = [
  {
    icon: Coffee,
    label: "Café da manhã",
    description: "Opções de café da manhã e menu à beira da piscina.",
  },
  {
    icon: Footprints,
    label: "Trilhas guiadas",
    description: "Caminhadas guiadas pela região serrana.",
  },
  {
    icon: Sparkles,
    label: "Massagem",
    description: "Sessões de massagem sob agendamento.",
  },
  {
    icon: Plane,
    label: "Transfer",
    description: "Serviço de traslado de aeroporto sob consulta.",
  },
];
