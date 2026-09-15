# Arquitetura

## Visão geral

Aplicação **Next.js 16 (App Router)** com renderização estática. Todas as rotas
são **prerenderizadas** no build (`○ Static`), o que garante performance e SEO.
Não há backend próprio nem banco de dados — a reserva acontece no Airbnb e o
contato via WhatsApp/telefone/e-mail.

## Camadas

```
config/  →  data/  →  components/  →  app/ (rotas)
```

- **`src/config/site.ts`** — fonte única de verdade para dados comerciais.
- **`src/data/*`** — conteúdo estruturado (galeria, comodidades, FAQ, etc.),
  tipado por `src/types`.
- **`src/components/*`** — UI. Divididos em `ui/` (primitivos), `layout/`,
  `sections/` (blocos da home), `gallery/`, `seo/`, `legal/`.
- **`src/app/*`** — rotas e metadados (SEO), montando seções e dados.

## Server vs Client Components

Por padrão tudo é **Server Component**. São Client Components apenas os que
precisam de interação/estado do navegador:

- `components/layout/navbar.tsx` (scroll + drawer mobile)
- `components/layout/whatsapp-float.tsx` (aparece ao rolar)
- `components/ui/reveal.tsx` (IntersectionObserver)
- `components/gallery/gallery-lightbox.tsx` (lightbox + teclado)
- `components/cta.tsx` (eventos de analytics)
- `components/map-embed.tsx` (mapa click-to-load)

Isso mantém o JavaScript enviado ao cliente no mínimo necessário.

## Padrões

- **Botões:** `buttonVariants` (cva) aplicado tanto a `<button>` quanto a
  `<Link>`/`<a>` — mesmo visual, semântica correta.
- **CTAs:** centralizados em `components/cta.tsx`. Telefone/WhatsApp derivam de
  `config/site.ts` via `lib/whatsapp.ts` (nada hardcoded).
- **Animações:** `Reveal` (fade-up on scroll) respeitando `prefers-reduced-motion`
  (via `globals.css`).
- **Imagens:** `next/image` com `fill` + `object-cover` em contêineres de
  proporção fixa (sem deformar); o lightbox usa `object-contain`.

## SEO / metadados

- `app/layout.tsx` — metadata global (title template, OG, Twitter, robots).
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, `app/opengraph-image.tsx`,
  `app/icon.svg`.
- Dados estruturados: `components/seo/structured-data.tsx` (LodgingBusiness) e a
  seção de FAQ (`FAQPage`).

## Testes

- **Vitest** (`tests/unit`): utilitários (`whatsapp`, `utils`).
- **Playwright** (`tests/e2e`): home, navegação (desktop e drawer mobile),
  galeria/lightbox, carregamento de todas as rotas, 404 e ausência de erros de
  console. Roda nos projetos `desktop` e `mobile`.
