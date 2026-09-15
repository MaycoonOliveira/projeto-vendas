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
 * Fatos confirmados a partir do anúncio público (Airbnb) e das fotos:
 *   - Nome: Casa Carram — "Uma Casa para se Apaixonar"
 *   - Local: Petrópolis, Região Serrana do Rio de Janeiro, Brasil
 *   - Casa inteira · 4 hóspedes · 2 quartos · 3 camas · 2,5 banheiros
 *   - Avaliação: 5,0 (12 avaliações) — "Favorito dos hóspedes" no Airbnb
 *   - Comodidades confirmadas: piscina, Wi-Fi, estacionamento gratuito,
 *     hidromassagem, cozinha, churrasqueira.
 */

/** URL pública do site (usada em canonical, Open Graph, sitemap). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.casacarram.com.br"; // TODO_CLIENTE: confirmar domínio final

export type NavItem = {
  label: string;
  href: string;
};

export const siteConfig = {
  name: "Casa Carram",
  shortName: "Carram",
  /** Assinatura do próprio anúncio — usada como subtítulo do hero. */
  tagline: "Uma casa para se apaixonar",
  legalName: "Casa Carram", // TODO_CLIENTE: razão social / responsável legal

  /** Descrição padrão para SEO (até ~160 caracteres). */
  description:
    "Refúgio contemporâneo na serra de Petrópolis, RJ. Arquitetura minimalista, piscina e Mata Atlântica para você desacelerar. Reserve a Casa Carram.",

  url: SITE_URL,

  /** Localização — nível de região confirmado; endereço exato pendente. */
  location: {
    city: "Petrópolis",
    region: "Região Serrana do Rio de Janeiro",
    state: "RJ",
    country: "Brasil",
    /** Endereço completo não divulgado publicamente pelo anúncio. */
    addressLine: "Endereço completo enviado após a reserva", // TODO_CLIENTE
    /** Consulta usada no Google Maps (região, não endereço exato). */
    mapsQuery: "Petrópolis, Rio de Janeiro, Brasil",
    mapsUrl: "https://www.google.com/maps/place/Petr%C3%B3polis+-+RJ",
    mapsEmbedSrc:
      "https://www.google.com/maps?q=Petr%C3%B3polis,%20Rio%20de%20Janeiro,%20Brasil&z=12&output=embed",
    /** Coordenadas aproximadas do município (centro), não da casa. */
    approxLatLng: { lat: -22.505, lng: -43.178 },
  },

  /** Canais de contato. Números são PLACEHOLDER — substituir antes de publicar. */
  contact: {
    // TODO_CLIENTE: número real com DDI+DDD, apenas dígitos (ex.: 5524999998888)
    whatsapp: "5524999999999",
    whatsappIsPlaceholder: true,
    // TODO_CLIENTE
    phoneDisplay: "+55 (24) 99999-9999",
    phoneE164: "+5524999999999",
    // TODO_CLIENTE
    email: "contato@casacarram.com.br",
    /** Mensagem pré-preenchida ao abrir o WhatsApp. */
    whatsappMessage:
      "Olá! Vim pelo site da Casa Carram e gostaria de saber mais sobre a disponibilidade e valores.",
  },

  /** Reserva. O Airbnb é o canal de reserva REAL e confirmado. */
  booking: {
    airbnbUrl: "https://www.airbnb.pt/rooms/1688073569848326515",
    // TODO_CLIENTE: adicionar link de reserva direta/Booking se houver
    directUrl: "",
    /** A partir de / diária — não divulgado. Exibir "Sob consulta". */
    priceFrom: null as number | null, // TODO_CLIENTE
    currency: "BRL",
  },

  /** Redes sociais. Preencher quando disponíveis. */
  socials: {
    instagram: "", // TODO_CLIENTE ex.: https://instagram.com/casacarram
    facebook: "",
  },

  /** Características confirmadas da propriedade. */
  property: {
    type: "Casa inteira",
    guests: 4,
    bedrooms: 2,
    beds: 3,
    bathrooms: "2,5",
  },

  /** Prova social — dados agregados reais do anúncio (sem citações inventadas). */
  reviews: {
    rating: 5.0,
    count: 12,
    source: "Airbnb",
    badge: "Favorito dos hóspedes",
    url: "https://www.airbnb.pt/rooms/1688073569848326515",
  },

  /** Navegação principal (usada em navbar e footer). */
  nav: [
    { label: "Início", href: "/" },
    { label: "A Casa", href: "/acomodacoes" },
    { label: "Galeria", href: "/galeria" },
    { label: "Localização", href: "/localizacao" },
    { label: "Contato", href: "/contato" },
  ] satisfies NavItem[],
} as const;

export type SiteConfig = typeof siteConfig;
