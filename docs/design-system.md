# Design System

Tema único, claro e acolhedor, com a **fotografia como protagonista**. Inspirado
na serra: verde da Mata Atlântica, tom argila e base off-white.

## Tokens (em `src/app/globals.css`, via `@theme` do Tailwind v4)

### Cores

| Token                     | Valor     | Uso                                  |
| ------------------------- | --------- | ------------------------------------ |
| `--color-background`      | `#fbf9f5` | Fundo geral (off-white)              |
| `--color-surface`         | `#ffffff` | Cards e superfícies                  |
| `--color-foreground`      | `#1f1d1a` | Texto principal (quase preto quente) |
| `--color-muted`           | `#f2ede4` | Faixas/áreas suaves                  |
| `--color-muted-foreground`| `#6e6a62` | Texto secundário                     |
| `--color-border`          | `#e7e1d6` | Bordas                               |
| `--color-primary`         | `#33503f` | Verde da marca (CTAs, destaques)     |
| `--color-primary-hover`   | `#2a4234` | Hover do primário                    |
| `--color-accent`          | `#b9704b` | Argila (detalhes, eyebrows)          |

Uso como utilitários Tailwind: `bg-primary`, `text-muted-foreground`,
`border-border`, etc.

### Tipografia

- **Display (títulos):** [Fraunces](https://fonts.google.com/specimen/Fraunces)
  — serif elegante, com variável `--font-fraunces` (via `next/font`).
- **Texto:** [Inter](https://fonts.google.com/specimen/Inter) — `--font-inter`.
- `h1..h4` usam a display automaticamente (regra em `globals.css`).
- Escala fluida com utilitários (`text-3xl sm:text-4xl lg:text-5xl`), com
  `text-wrap: balance` nos títulos.

### Raio e sombra

- `--radius: 0.75rem`; cards usam `rounded-2xl`; botões e pílulas `rounded-full`.
- Sombras: `--shadow-soft` (cards) e `--shadow-lift` (elementos em destaque).

## Componentes-base (`src/components/ui`)

- **`Button` / `buttonVariants`** — variantes: `primary`, `accent`, `outline`,
  `ghost`, `light`, `outlineLight`; tamanhos `sm`/`md`/`lg`.
- **`Container`** — largura máxima + padding lateral responsivo (gutter mínimo).
- **`SectionHeading`** — eyebrow + título + descrição (com `Reveal`).
- **`Reveal`** — fade-up on scroll (respeita reduced motion).
- **`Badge`** — pílula para rótulos.

## Utilitário `.eyebrow`

Rótulo em caixa alta, espaçado, na cor accent — usado acima dos títulos de seção.

## Diretrizes

- Fotografia grande e sem deformação (`object-cover`; lightbox `object-contain`).
- Poucos gradientes; nada de glassmorphism exagerado.
- Animações discretas (fade/reveal, hover sutil).
- Contraste alto: texto do hero sobre gradiente escuro; navbar muda para fundo
  sólido ao rolar.
