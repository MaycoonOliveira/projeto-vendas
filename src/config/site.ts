/**
 * ============================================================================
 * CONFIGURAÇÃO CENTRAL DO SITE — fonte única de verdade
 * ============================================================================
 *
 * Todo o conteúdo comercial editável fica AQUI. Não espalhe telefone, links,
 * textos ou imagens pelo código: altere neste arquivo.
 *
 * Convenções de placeholder:
 *   - Valores marcados com "TODO_CLIENTE" precisam ser confirmados/substituídos
 *     pelo proprietário antes da publicação. Veja docs/client-content-checklist.md
 *
 * Fatos confirmados a partir do site oficial (casadanete.com.br):
 *   - Nome: Pousada Casa da Nete — "A 30 passos da praia"
 *   - Local: Monte Alto, Arraial do Cabo, Região dos Lagos, RJ, Brasil
 *   - Pousada com 5 suítes (Nete, Vitor, Marreta, Loft Hugo, Lavínia)
 *   - Café da manhã servido das 7h às 9h; espaço de lazer "Aconchego"
 *   - Reserva feita diretamente pelo WhatsApp: +55 (21) 98233-1649
 *   - Instagram: @casadanete
 */

/** URL pública do site (usada em canonical, Open Graph, sitemap). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.casadanete.com.br";

export type NavItem = {
  label: string;
  href: string;
};

export const siteConfig = {
  name: "Casa da Nete",
  shortName: "Casa da Nete",
  /** Assinatura da própria pousada — usada como subtítulo do hero. */
  tagline: "A 30 passos da praia, em Arraial do Cabo",
  legalName: "Pousada Casa da Nete",

  /** Descrição padrão para SEO (até ~160 caracteres). */
  description:
    "Pousada aconchegante em Monte Alto, Arraial do Cabo (RJ), a 30 passos da praia de Massambaba. Café da manhã caprichado e suítes confortáveis. Reserve pelo WhatsApp.",

  url: SITE_URL,

  /** Localização — confirmada pelo site: Monte Alto, Arraial do Cabo. */
  location: {
    city: "Arraial do Cabo",
    region: "Região dos Lagos",
    state: "RJ",
    country: "Brasil",
    /** Bairro/distrito da pousada, a poucos passos da praia de Massambaba. */
    addressLine: "Monte Alto, Arraial do Cabo — RJ", // TODO_CLIENTE: número/rua exatos
    /** Consulta usada no Google Maps. */
    mapsQuery: "Pousada Casa da Nete, Monte Alto, Arraial do Cabo - RJ",
    mapsUrl:
      "https://www.google.com/maps/place/Monte+Alto,+Arraial+do+Cabo+-+RJ",
    mapsEmbedSrc:
      "https://www.google.com/maps?q=Monte%20Alto,%20Arraial%20do%20Cabo%20-%20RJ&z=14&output=embed",
    /** Coordenadas aproximadas de Monte Alto (Arraial do Cabo). */
    approxLatLng: { lat: -22.9483, lng: -42.0389 }, // TODO_CLIENTE: coordenadas exatas
  },

  /** Canais de contato — WhatsApp confirmado pelo site oficial. */
  contact: {
    // Número real divulgado no site (DDI+DDD, apenas dígitos).
    whatsapp: "5521982331649",
    whatsappIsPlaceholder: false,
    phoneDisplay: "+55 (21) 98233-1649",
    phoneE164: "+5521982331649",
    // TODO_CLIENTE: e-mail não divulgado publicamente no site.
    email: "contato@casadanete.com.br",
    /** Mensagem pré-preenchida ao abrir o WhatsApp. */
    whatsappMessage:
      "Olá! Vi o site da Pousada Casa da Nete e gostaria de saber sobre disponibilidade e valores. 🧡",
  },

  /** Reserva. O canal real e confirmado da Casa da Nete é o WhatsApp. */
  booking: {
    airbnbUrl: "",
    // TODO_CLIENTE: adicionar link de reserva direta/Booking se houver.
    directUrl: "",
    /** A partir de / diária — não divulgado. Exibir "Sob consulta". */
    priceFrom: null as number | null, // TODO_CLIENTE
    currency: "BRL",
  },

  /** Redes sociais — Instagram confirmado pelo site. */
  socials: {
    instagram: "https://instagram.com/casadanete",
    facebook: "",
  },

  /** Características da pousada (agregado das 5 suítes). */
  property: {
    type: "Pousada",
    guests: 24, // TODO_CLIENTE: capacidade total a confirmar
    bedrooms: 5, // 5 suítes
    beds: 5, // TODO_CLIENTE: a confirmar
    bathrooms: "5", // suítes com banheiro
  },

  /** Prova social. Casa da Nete exibe avaliações no Google. */
  reviews: {
    rating: 5.0, // TODO_CLIENTE: nota real a confirmar
    count: 12, // TODO_CLIENTE: quantidade real a confirmar
    source: "Google",
    badge: "Recomendada pelos hóspedes",
    url: "", // TODO_CLIENTE: link do perfil no Google
  },

  /** Navegação principal (usada em navbar e footer). */
  nav: [
    { label: "Início", href: "/" },
    { label: "A Pousada", href: "/acomodacoes" },
    { label: "Galeria", href: "/galeria" },
    { label: "Localização", href: "/localizacao" },
    { label: "Contato", href: "/contato" },
  ] satisfies NavItem[],
} as const;

export type SiteConfig = typeof siteConfig;
