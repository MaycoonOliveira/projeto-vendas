# Casa Carram — Website

Site institucional e de conversão para a **Casa Carram**, casa de temporada
contemporânea em **Petrópolis (Região Serrana do Rio de Janeiro)**.

O objetivo do site é apresentar a casa, gerar desejo de hospedagem, transmitir
confiança e direcionar o visitante à reserva (Airbnb) e ao contato (WhatsApp).

> **Importante:** este é um projeto real, com conteúdo baseado em fatos públicos
> do anúncio. Alguns dados comerciais são **placeholders** e precisam ser
> confirmados antes da publicação — veja
> [`docs/client-content-checklist.md`](docs/client-content-checklist.md).

---

## Stack

- **Next.js 16** (App Router, Server Components, Turbopack)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (design tokens em `src/app/globals.css`)
- **lucide-react** (ícones) · **class-variance-authority** + **tailwind-merge**
- **next/font** (Fraunces + Inter) · **next/image** (otimização de imagens)
- **next/og** (cartão Open Graph gerado)
- **ESLint** + **Prettier**
- **Vitest** (testes unitários) · **Playwright** (E2E, desktop + mobile)

## Requisitos

- Node.js 20+
- npm 10+

## Instalação e execução

```bash
npm install          # instala dependências
npm run dev          # ambiente de desenvolvimento (http://localhost:3000)
```

### Scripts

| Script                | O que faz                                        |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Servidor de desenvolvimento                      |
| `npm run build`       | Build de produção                                |
| `npm run start`       | Sobe o build de produção (requer `build` antes)  |
| `npm run lint`        | ESLint                                           |
| `npm run typecheck`   | Verificação de tipos (tsc)                       |
| `npm run format`      | Formata o código com Prettier                    |
| `npm run test`        | Testes unitários (Vitest)                        |
| `npm run test:e2e`    | Testes end-to-end (Playwright, sobe o servidor)  |

> Para o E2E: rode `npm run build` antes (o Playwright inicia `npm run start`).
> Na primeira vez, instale o navegador: `npx playwright install chromium`.

## Estrutura

```
src/
  app/                # rotas (App Router), SEO (sitemap/robots/manifest/OG), layout
  components/
    layout/           # navbar, footer, page-header, botão flutuante de WhatsApp
    sections/         # seções da home (hero, sobre, comodidades, etc.)
    ui/               # primitivos (button, container, reveal, badge, section-heading)
    gallery/          # galeria com lightbox
    seo/              # dados estruturados (JSON-LD)
    legal/            # aviso de conteúdo legal
    cta.tsx           # botões de conversão (reserva, WhatsApp, telefone)
    map-embed.tsx     # mapa com "click-to-load"
  config/site.ts      # >>> CONFIGURAÇÃO CENTRAL (edite aqui) <<<
  data/               # conteúdo (galeria, comodidades, FAQ, acomodações, etc.)
  lib/                # utils, whatsapp, analytics
  types/              # tipos compartilhados
public/images/        # fotos da casa (.avif)
tests/                # unit (Vitest) e e2e (Playwright)
docs/                 # documentação do projeto e checklist do cliente
```

## Como personalizar

Praticamente todo o conteúdo comercial fica em **`src/config/site.ts`**
(nome, contatos, links, localização, reviews, navegação) e nos arquivos de
**`src/data/`** (galeria, comodidades, FAQ, acomodações, pontos de interesse,
depoimentos).

### Substituir imagens

As fotos ficam em `public/images/` e são referenciadas em
[`src/data/gallery.ts`](src/data/gallery.ts). Para trocar:

1. Coloque as novas imagens em `public/images/` (recomendado: `.avif`/`.webp`).
2. Atualize os `src` e os textos `alt` em `src/data/gallery.ts`.

Veja [`docs/images.md`](docs/images.md) — inclui a **nota sobre direitos de uso**
das imagens atuais.

### Configurar WhatsApp

Edite `siteConfig.contact.whatsapp` (formato **só dígitos**, com DDI+DDD, ex.:
`5524999998888`) e `siteConfig.contact.whatsappMessage`. O link é montado em
`src/lib/whatsapp.ts` e usado por todos os botões — **não há telefone hardcoded**
espalhado pelo código.

### Configurar reservas

O botão "Reservar agora" leva ao anúncio oficial no Airbnb
(`siteConfig.booking.airbnbUrl`). Para adicionar reserva direta/Booking,
preencha `siteConfig.booking.directUrl`.

### Analytics

A camada em `src/lib/analytics.ts` está **preparada, mas desativada**. Ela envia
eventos (`click_reservation`, `click_whatsapp`, `click_phone`, `gallery_open`,
`accommodation_view`) para `window.dataLayer` quando um GTM/GA4 for instalado.
Veja [`docs/seo.md`](docs/seo.md).

## Deploy

Otimizado para **Vercel**. Passo a passo em
[`docs/deployment.md`](docs/deployment.md). Defina a variável
`NEXT_PUBLIC_SITE_URL` com o domínio final (ver `.env.example`).

## Documentação

Consulte a pasta [`docs/`](docs/) — visão geral, arquitetura, design system,
conteúdo, imagens, SEO, deploy, checklist do cliente e handoff.
