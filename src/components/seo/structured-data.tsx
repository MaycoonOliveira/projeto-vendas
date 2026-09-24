import { siteConfig, SITE_URL } from "@/config/site";
import { amenities } from "@/data/amenities";
import { heroImage } from "@/data/gallery";

/**
 * Dados estruturados Schema.org (JSON-LD) para a hospedagem.
 *
 * Inclui APENAS informações confirmadas. Propositalmente NÃO publicamos
 * telefone, preço ou endereço exato porque ainda são placeholders/desconhecidos
 * — para não expor dados inventados. Complete quando os dados forem reais.
 */
export function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: siteConfig.name,
    description: siteConfig.description,
    url: SITE_URL,
    image: `${SITE_URL}${heroImage.src}`,
    slogan: siteConfig.tagline,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.location.city,
      addressRegion: siteConfig.location.state,
      addressCountry: "BR",
    },
    amenityFeature: amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a.label,
      value: true,
    })),
    numberOfRooms: siteConfig.property.bedrooms,
    petsAllowed: undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: siteConfig.reviews.rating,
      reviewCount: siteConfig.reviews.count,
      bestRating: 5,
    },
    telephone: siteConfig.contact.phoneE164,
    sameAs: [siteConfig.socials.instagram, siteConfig.socials.facebook].filter(
      Boolean,
    ),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
