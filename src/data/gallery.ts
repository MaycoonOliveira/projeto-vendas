import type { GalleryImage } from "@/types";

/**
 * Galeria da Casa Carram.
 *
 * A ordem foi curada a partir da identificação visual de cada foto: as imagens
 * mais impactantes (fachada, piscina, deck e vistas da serra) vêm primeiro e
 * ocupam os destaques; ambientes internos, quartos e banheiros vêm na sequência.
 * Cada item aponta para um arquivo em /public/images. Ver docs/images.md.
 *
 * ATENÇÃO (direitos): as imagens podem ter origem em anúncio de terceiros.
 * Antes de publicar, confirme a autorização de uso comercial e/ou substitua
 * pelas versões cedidas pelo proprietário — basta trocar os arquivos/os `src`.
 */

const BASE = "/images";

export const galleryImages: GalleryImage[] = [
  // ---- Externas / piscina / vistas (destaques) ----
  {
    src: `${BASE}/120f256e-28e0-4f65-b153-d727e7e9dc8e.avif`,
    alt: "Fachada contemporânea da Casa Carram com piscina, jardim e a serra de Petrópolis ao fundo",
    featured: true,
  },
  {
    src: `${BASE}/28fc87d6-4947-42b6-903a-167130df51df.avif`,
    alt: "Piscina ao ar livre com deck e vista para as montanhas da Mata Atlântica",
    featured: true,
  },
  {
    src: `${BASE}/bfadcb8b-1328-472f-aba3-a5236d7c1b40.avif`,
    alt: "Piscina e deck sob o sol, com as montanhas ao fundo",
    featured: true,
  },
  {
    src: `${BASE}/d93556d7-6306-4ff3-a0f4-eb8f0ff57d9c.avif`,
    alt: "Deck com piscina e vista panorâmica para o vale de Petrópolis",
    featured: true,
  },
  {
    src: `${BASE}/acbd6f2f-f394-43cf-9f59-afb07a6b964a.avif`,
    alt: "Área de estar externa sob o toldo listrado, à beira da piscina",
    featured: true,
  },
  {
    src: `${BASE}/9a3572c8-1e70-4f79-9e12-aa09882e575a.avif`,
    alt: "Piscina iluminada ao anoitecer, com o céu da serra",
  },
  {
    src: `${BASE}/5c38c27c-0f29-44ac-9bf1-1b040c5bef0c.avif`,
    alt: "Casa Carram vista do jardim, com piscina e pergolado",
    featured: true,
  },
  {
    src: `${BASE}/b81ea868-c71d-44a5-aad3-65af9736d165.avif`,
    alt: "Piscina e jardim com espreguiçadeiras e vista para a mata",
  },
  {
    src: `${BASE}/3676ef59-a327-4549-a5b1-5eccdc4eeba3.avif`,
    alt: "Fachada iluminada da Casa Carram ao entardecer",
    featured: true,
  },
  {
    src: `${BASE}/71072fa9-cd34-45ea-8539-f7a1740cde05.avif`,
    alt: "Vista da Mata Atlântica a partir do deck da casa",
  },
  {
    src: `${BASE}/4abeb91b-9fa9-4055-a493-4a8c851292e1.avif`,
    alt: "Área externa com churrasqueira e toldo listrado",
  },
  {
    src: `${BASE}/345103be-37c7-4c51-8001-b08bc78f55f1.avif`,
    alt: "Vista superior da piscina e do deck da Casa Carram",
  },
  // ---- Internas: living / cozinha / jantar ----
  {
    src: `${BASE}/05d2d4ff-65a6-4878-919f-e67dc3623a07.avif`,
    alt: "Living integrado com lareira e vista para a piscina",
    featured: true,
  },
  {
    src: `${BASE}/a0ccaf51-65d7-442e-981a-255656c0d8d7.avif`,
    alt: "Sala de estar com parede de pedra e rede, aberta para a natureza",
  },
  {
    src: `${BASE}/c35d63e0-41ce-496c-bb18-259fe6a83628.avif`,
    alt: "Cozinha e living integrados, com muita luz natural",
  },
  {
    src: `${BASE}/ccd08395-8667-4eb9-8ad5-8c49f6701df5.avif`,
    alt: "Ambiente de convívio com lareira e vista para o verde",
  },
  {
    src: `${BASE}/efce6f2e-399d-4366-bd6f-4001a476b04a.avif`,
    alt: "Estar aconchegante com lareira e parede de pedra",
  },
  {
    src: `${BASE}/ef8a73e2-b738-47de-bd16-129670cb7481.avif`,
    alt: "Cozinha e sala de jantar com vista para a serra",
  },
  {
    src: `${BASE}/3e3c5d3d-73b4-4eb2-bb58-51861b5871cc.avif`,
    alt: "Living com lareira e piscina ao fundo",
  },
  {
    src: `${BASE}/c3c56b57-2b4c-4caa-9197-3a2e3e9a1b39.avif`,
    alt: "Jardim com palmeiras e vista para as montanhas",
  },
  {
    src: `${BASE}/ec2f85ea-36fe-48d4-897c-0c916eaa3490.avif`,
    alt: "Cozinha equipada com geladeira retrô e churrasqueira",
  },
  {
    src: `${BASE}/457f8fe7-8166-4b67-a03d-fb99aa177b11.avif`,
    alt: "Detalhe da cozinha com bancada de granito",
  },
  {
    src: `${BASE}/8c053560-3ed6-45c2-b75c-ea91df3a12bd.avif`,
    alt: "Cozinha completa para preparar suas refeições",
  },
  // ---- Quartos ----
  {
    src: `${BASE}/20d0ab4e-5d3d-4cd0-8bf0-b707d57edaa3.avif`,
    alt: "Quarto confortável da Casa Carram",
  },
  {
    src: `${BASE}/c3cad71d-c6d3-43cb-a707-51d076f8136e.avif`,
    alt: "Quarto com portas de vidro e vista para a piscina",
  },
  // ---- Áreas externas / banheiros ----
  {
    src: `${BASE}/ccef82f9-fd95-45e4-b6d5-e1ef1c0c985d.avif`,
    alt: "Recanto no jardim para relaxar ao ar livre",
  },
  {
    src: `${BASE}/c90d0935-a76c-4e6b-acb8-e495d1aba0b4.avif`,
    alt: "Banheiro com box de vidro",
  },
  {
    src: `${BASE}/e4996b0a-3951-4dce-9116-45ccc16517b6.avif`,
    alt: "Lavabo com acabamento clean",
  },
  {
    src: `${BASE}/f81147df-9923-474d-acd9-29a973e8223a.avif`,
    alt: "Banheiro amplo e iluminado",
  },
];

/** Imagem principal do hero (a melhor foto externa disponível). */
export const heroImage = galleryImages[0];

/** Fotos de destaque usadas em prévias e composições. */
export const featuredImages = galleryImages.filter((i) => i.featured);
