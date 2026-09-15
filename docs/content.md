# Conteúdo

Onde cada texto/dado vive e como editar.

## Configuração central — `src/config/site.ts`

- Nome, tagline, descrição (SEO).
- `location`: cidade/região/estado, endereço (placeholder), mapa.
- `contact`: WhatsApp, telefone, e-mail (**placeholders**) e mensagem padrão.
- `booking`: link do Airbnb (real), reserva direta (opcional), preço (`null`).
- `socials`: Instagram/Facebook (vazios até serem informados).
- `property`: 4 hóspedes, 2 quartos, 3 camas, 2,5 banheiros (confirmados).
- `reviews`: 5,0 · 12 avaliações · "Favorito dos hóspedes" (agregado real).
- `nav`: itens de navegação.

## Dados — `src/data/`

| Arquivo                  | Conteúdo                                               |
| ------------------------ | ------------------------------------------------------ |
| `gallery.ts`             | Fotos (src + alt), curadas por tipo; hero e destaques  |
| `amenities.ts`           | Comodidades confirmadas + serviços sob consulta        |
| `differentials.ts`       | 4 diferenciais (derivados de fatos)                    |
| `accommodations.ts`      | A casa (números reais, descrição, destaques)           |
| `faq.ts`                 | Perguntas frequentes                                   |
| `points-of-interest.ts`  | Pontos de interesse em Petrópolis (sem distâncias)     |
| `testimonials.ts`        | **Vazio** — não inventamos depoimentos                 |

## Regras de conteúdo adotadas

- **Nada inventado.** Só usamos o que é visível nas fotos ou confirmado no anúncio.
- **Sem distâncias/tempos** de deslocamento (não confirmados).
- **Sem preços** inventados — exibimos "sob consulta" e link do Airbnb.
- **Depoimentos:** exibimos apenas o agregado real (nota + selo). Citações
  individuais só entram se forem reais e autorizadas (`testimonials.ts`).
- **Textos legais** (`/termos`, `/politica-de-privacidade`) são **modelos** e
  precisam de revisão jurídica (há aviso visível na página).

## Placeholders a substituir (`TODO_CLIENTE`)

Busque por `TODO_CLIENTE` no código. Consolidado em
[`client-content-checklist.md`](client-content-checklist.md).
