import type { FaqItem } from "@/types";

/**
 * Perguntas frequentes. As respostas usam apenas dados confirmados do site
 * oficial; onde a política não é conhecida, direcionamos para o WhatsApp em vez
 * de inventar.
 *
 * TODO_CLIENTE: revisar e completar as políticas reais (check-in/out, regras
 * da pousada, animais, cancelamento). Ver docs/client-content-checklist.md.
 */
export const faqItems: FaqItem[] = [
  {
    question: "Quais são as acomodações da Casa da Nete?",
    answer:
      "A pousada tem suítes confortáveis (como a Suíte Nete, Suíte Vitor, Suíte Marreta, Loft Hugo e Suíte Lavínia), com capacidades que vão de 2 a 6 pessoas. Fale com a gente no WhatsApp para escolher a ideal.",
  },
  {
    question: "Onde fica a Casa da Nete?",
    answer:
      "Em Monte Alto, Arraial do Cabo (RJ), a apenas 30 passos da praia de Massambaba. Daqui você chega rápido às praias e passeios mais procurados da cidade.",
  },
  {
    question: "O café da manhã está incluso?",
    answer:
      "Servimos um café da manhã caprichado das 7h às 9h, com combos para todos os gostos — de tapioca a cuscuz com bacon, pães quentinhos, frutas e café coado na hora. Há até combo kids.",
  },
  {
    question: "Quais são as áreas de lazer?",
    answer:
      "O Espaço Aconchego reúne redes, totó, jogos para todas as idades, lareira para as noites mais frescas e churrasqueira. Tem também chuveirão e lavabo.",
  },
  {
    question: "Como faço a reserva?",
    answer:
      "As reservas são feitas diretamente pelo WhatsApp. Chame a gente para ver disponibilidade, valores e tirar dúvidas — a gente responde rapidinho.",
  },
  {
    question: "Quais são os horários de check-in e check-out e as regras da pousada?",
    answer:
      "As políticas de check-in, check-out e regras podem ser confirmadas diretamente com a gente pelo WhatsApp antes da reserva.",
  },
];
