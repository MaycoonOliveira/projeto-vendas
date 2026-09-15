import type { FaqItem } from "@/types";

/**
 * Perguntas frequentes. As respostas usam apenas dados confirmados; onde a
 * política não é conhecida, direcionamos para contato/Airbnb em vez de inventar.
 *
 * TODO_CLIENTE: revisar e completar as políticas reais (check-in/out, regras
 * da casa, animais, cancelamento). Ver docs/client-content-checklist.md.
 */
export const faqItems: FaqItem[] = [
  {
    question: "Quantas pessoas a Casa Carram acomoda?",
    answer:
      "A casa é ideal para até 4 hóspedes, com 2 quartos, 3 camas e 2,5 banheiros.",
  },
  {
    question: "Onde fica a Casa Carram?",
    answer:
      "Em Petrópolis, na região serrana do Rio de Janeiro, cercada pela Mata Atlântica. O endereço completo é enviado após a confirmação da reserva.",
  },
  {
    question: "A casa tem piscina?",
    answer:
      "Sim. Há piscina ao ar livre com deck e área de hidromassagem, além de espaço para relaxar ao ar livre.",
  },
  {
    question: "Tem Wi-Fi, estacionamento e churrasqueira?",
    answer:
      "Sim. A casa conta com Wi-Fi, estacionamento gratuito no local, cozinha equipada e churrasqueira.",
  },
  {
    question: "Como faço a reserva?",
    answer:
      "Você pode reservar diretamente pelo anúncio no Airbnb ou falar com a gente pelo WhatsApp para tirar dúvidas sobre disponibilidade.",
  },
  {
    question: "Qual é o valor da diária?",
    answer:
      "Os valores variam conforme a época e a disponibilidade. Consulte as datas desejadas no Airbnb ou entre em contato pelo WhatsApp.",
  },
  {
    question: "Quais são os horários de check-in e check-out e as regras da casa?",
    answer:
      "As políticas de check-in, check-out e regras da casa podem ser confirmadas no anúncio do Airbnb ou diretamente com a gente antes da reserva.",
  },
];
