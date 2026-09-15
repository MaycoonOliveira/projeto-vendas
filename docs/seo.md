# SEO & Analytics

## Metadados

- **Global** em `src/app/layout.tsx`: `metadataBase`, `title` (com template
  `%s · Casa Carram`), `description`, keywords, Open Graph, Twitter Card, robots,
  `themeColor`, idioma `pt-BR`.
- **Por página**: cada rota define seu `title`/`description` e `canonical`.
- **`NEXT_PUBLIC_SITE_URL`** define a URL base usada em canonical, OG e sitemap.
  Defina no ambiente de produção (ver `.env.example`).

## Arquivos gerados

| Arquivo                     | Rota                     |
| --------------------------- | ------------------------ |
| `app/sitemap.ts`            | `/sitemap.xml`           |
| `app/robots.ts`             | `/robots.txt`            |
| `app/manifest.ts`           | `/manifest.webmanifest`  |
| `app/opengraph-image.tsx`   | `/opengraph-image` (PNG) |
| `app/icon.svg`              | favicon                  |

O cartão Open Graph é **gerado** (não depende das fotos), evitando problemas de
direitos de imagem no compartilhamento.

## Dados estruturados (Schema.org)

- `components/seo/structured-data.tsx` → **LodgingBusiness** (nome, descrição,
  URL, imagem, endereço em nível de cidade/estado, comodidades, `aggregateRating`
  real 5,0/12, `sameAs` para o Airbnb).
- Seção de FAQ → **FAQPage**.

> Propositalmente **não** publicamos telefone, preço ou endereço exato nos dados
> estruturados enquanto forem placeholders/desconhecidos — para não expor
> informação inventada. Complete quando os dados forem reais.

## Analytics (preparado, desativado)

`src/lib/analytics.ts` expõe `track(event, payload)` que envia para
`window.dataLayer` **se** um provedor já estiver instalado. Eventos previstos:

- `click_reservation` · `click_whatsapp` · `click_phone`
- `gallery_open` · `accommodation_view`

### Para ativar (ex.: GA4 via GTM)

1. Instale o GTM/GA4 (script no `layout.tsx` ou via `@next/third-parties`).
2. Configure os gatilhos usando os **mesmos nomes de evento** acima.
3. Antes de coletar dados, atualize a Política de Privacidade e, se aplicável,
   adicione um banner de consentimento de cookies.
