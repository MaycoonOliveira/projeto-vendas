import type { GalleryImage } from "@/types";

/**
 * Galeria da Casa da Nete.
 *
 * Fotos oficiais da pousada, obtidas do site do cliente (casadanete.com.br).
 * A ordem é curada: fachada e área de lazer (Espaço Aconchego) em destaque,
 * seguidas das suítes e do café da manhã. Cada item aponta para um arquivo em
 * /public/brand/fotos.
 *
 * TODO_CLIENTE: substitua/complemente com novas fotos quando desejar — basta
 * trocar os arquivos em /public/brand/fotos ou os `src` abaixo.
 */

const BASE = "/brand/fotos";

export const galleryImages: GalleryImage[] = [
  // ---- Fachada / área externa (destaques) ----
  {
    src: `${BASE}/capa.jpg`,
    alt: "Fachada da Pousada Casa da Nete, em Monte Alto, Arraial do Cabo",
    featured: true,
  },
  {
    src: `${BASE}/espaco-1.jpg`,
    alt: "Espaço Aconchego: área de lazer da pousada para relaxar em família",
    featured: true,
  },
  {
    src: `${BASE}/espaco-2.jpg`,
    alt: "Área externa com redes para descansar no Espaço Aconchego",
    featured: true,
  },
  {
    src: `${BASE}/espaco-3.jpg`,
    alt: "Churrasqueira e espaço de convívio ao ar livre",
    featured: true,
  },
  {
    src: `${BASE}/espaco-4.jpg`,
    alt: "Área de lazer com jogos para todas as idades",
  },
  {
    src: `${BASE}/espaco-5.jpg`,
    alt: "Ambiente aconchegante com lareira para as noites mais frescas",
  },
  {
    src: `${BASE}/espaco-6.jpg`,
    alt: "Recanto ao ar livre para relaxar na pousada",
  },
  {
    src: `${BASE}/espaco-7.jpg`,
    alt: "Espaço de convivência da Casa da Nete",
  },
  // ---- Suítes ----
  {
    src: `${BASE}/nete-1.jpg`,
    alt: "Suíte Nete, com rede privativa e vista parcial para o mar",
    featured: true,
  },
  {
    src: `${BASE}/nete-2.jpg`,
    alt: "Detalhe da Suíte Nete, a queridinha dos hóspedes",
  },
  {
    src: `${BASE}/vitor-1.jpg`,
    alt: "Suíte Vitor, espaçosa e confortável para família ou grupo",
    featured: true,
  },
  {
    src: `${BASE}/vitor-2.jpg`,
    alt: "Ambiente da Suíte Vitor, que acomoda até 4 pessoas",
  },
  {
    src: `${BASE}/marreta-1.jpg`,
    alt: "Suíte Marreta, térrea e com acessibilidade",
    featured: true,
  },
  {
    src: `${BASE}/marreta-2.jpg`,
    alt: "Detalhe da Suíte Marreta, pensada para receber bem quem precisa",
  },
  {
    src: `${BASE}/hugo-1.jpg`,
    alt: "Loft Hugo, suíte térrea com cozinha",
    featured: true,
  },
  {
    src: `${BASE}/hugo-2.jpg`,
    alt: "Cozinha do Loft Hugo, para quem gosta de praticidade",
  },
  {
    src: `${BASE}/lavinia-1.jpg`,
    alt: "Suíte Lavínia, a maior da casa, com cozinha integrada",
    featured: true,
  },
  {
    src: `${BASE}/lavinia-2.jpg`,
    alt: "Suíte Lavínia com vista parcial para o mar",
  },
  {
    src: `${BASE}/nete-3.jpg`,
    alt: "Outro ângulo da Suíte Nete",
  },
  {
    src: `${BASE}/vitor-3.jpg`,
    alt: "Detalhes da Suíte Vitor",
  },
  {
    src: `${BASE}/hugo-3.jpg`,
    alt: "Ambiente do Loft Hugo",
  },
  {
    src: `${BASE}/lavinia-3.jpg`,
    alt: "Espaço integrado da Suíte Lavínia",
  },
  // ---- Café da manhã ----
  {
    src: `${BASE}/cafe-1.jpg`,
    alt: "Café da manhã caprichado servido na Casa da Nete",
    featured: true,
  },
  {
    src: `${BASE}/cafe-2.jpg`,
    alt: "Mesa de café da manhã com pães, frutas e café coado",
  },
  {
    src: `${BASE}/cafe-3.jpg`,
    alt: "Combo de café da manhã da pousada",
  },
  {
    src: `${BASE}/cafe-4.jpg`,
    alt: "Opções variadas no café da manhã",
  },
];

/** Imagem principal do hero (fachada oficial da pousada). */
export const heroImage = galleryImages[0];

/** Fotos de destaque usadas em prévias e composições. */
export const featuredImages = galleryImages.filter((i) => i.featured);
