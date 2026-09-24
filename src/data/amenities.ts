import {
  Accessibility,
  Bed,
  Binoculars,
  Coffee,
  Dices,
  Flame,
  Ship,
  ShowerHead,
  Sun,
  TreePine,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import type { Amenity } from "@/types";

/**
 * Comodidades CONFIRMADAS no site oficial da Casa da Nete.
 * Não adicione itens não confirmados. Ver docs/content.md.
 */
export const amenities: Amenity[] = [
  {
    icon: Waves,
    label: "A 30 passos da praia",
    description: "O mar logo ali, sem precisar de carro.",
  },
  {
    icon: Coffee,
    label: "Café da manhã",
    description: "Combos caprichados servidos das 7h às 9h.",
  },
  {
    icon: Bed,
    label: "Suítes confortáveis",
    description: "Acomodações para casais, famílias e grupos.",
  },
  {
    icon: UtensilsCrossed,
    label: "Suítes com cozinha",
    description: "Autonomia total no Loft Hugo e na Suíte Lavínia.",
  },
  {
    icon: Flame,
    label: "Lareira & churrasqueira",
    description: "Para as noites frescas e para reunir todo mundo.",
  },
  {
    icon: Dices,
    label: "Espaço Aconchego",
    description: "Redes, totó e jogos para todas as idades.",
  },
  {
    icon: Accessibility,
    label: "Acessibilidade",
    description: "Suíte térrea pensada para receber bem quem precisa.",
  },
  {
    icon: ShowerHead,
    label: "Chuveirão & lavabo",
    description: "Comodidade extra na área de lazer.",
  },
];

/**
 * Praias e passeios PRÓXIMOS, citados no site oficial. Distâncias podem variar.
 */
export const experiences: Amenity[] = [
  {
    icon: TreePine,
    label: "Praias paradisíacas",
    description: "Prainha, Praia do Forno e Praia dos Anjos pertinho.",
  },
  {
    icon: Ship,
    label: "Passeio de barco",
    description: "Grutas, ilhas e praias só acessíveis pelo mar.",
  },
  {
    icon: Binoculars,
    label: "Pontal do Atalaia",
    description: "Mirante com uma das vistas mais bonitas do litoral.",
  },
  {
    icon: Sun,
    label: "Praia Grande",
    description: "Extensa faixa de areia para caminhadas ao pôr do sol.",
  },
];
