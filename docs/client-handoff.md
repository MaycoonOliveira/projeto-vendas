# Handoff

Resumo para entrega ao cliente / próxima pessoa desenvolvedora.

## Status

Website **funcional e pronto para revisão**, com conteúdo baseado em fatos
públicos e **placeholders documentados** para os dados comerciais que faltam.

- ✅ Build de produção sem erros (13 rotas estáticas).
- ✅ Lint, typecheck e testes (unit + E2E desktop/mobile) passando.
- ✅ Responsivo (mobile, tablet, desktop), SEO e acessibilidade cuidados.
- ⏳ Pendências: itens do [`client-content-checklist.md`](client-content-checklist.md).

## Como rodar

```bash
npm install
npm run dev            # http://localhost:3000
```

Validação completa:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
npx playwright install chromium   # 1ª vez
npm run test:e2e
```

## O que o cliente precisa fornecer

Ver o checklist. Os essenciais para publicar:

1. **WhatsApp, telefone e e-mail** reais.
2. **Domínio** (`NEXT_PUBLIC_SITE_URL`).
3. **Autorização/substituição das imagens.**
4. **Revisão dos textos legais** e das políticas da casa (FAQ).

## Onde editar (mapa rápido)

| Quero mudar…                     | Edite…                                   |
| -------------------------------- | ---------------------------------------- |
| Nome, contatos, links, reviews   | `src/config/site.ts`                     |
| Fotos                            | `public/images/` + `src/data/gallery.ts` |
| Comodidades / serviços           | `src/data/amenities.ts`                  |
| Perguntas frequentes             | `src/data/faq.ts`                        |
| Descrição da casa                | `src/data/accommodations.ts`             |
| Pontos de interesse              | `src/data/points-of-interest.ts`         |
| Depoimentos                      | `src/data/testimonials.ts`               |
| Cores / tipografia               | `src/app/globals.css`                    |

## Decisões de projeto (por quê)

- **Sem invenção de fatos.** Preços, distâncias e depoimentos individuais não
  foram inventados; usamos "sob consulta", links e o agregado real de avaliações.
- **Reserva via Airbnb + WhatsApp.** Não construímos um motor de reservas
  fictício; o site é orientado à conversão por esses canais reais.
- **Mapa "click-to-load".** O iframe do Google Maps só carrega ao clique
  (melhor performance e privacidade).
- **Cartão OG gerado.** Não depende das fotos (evita questões de direitos).

## Próximos passos sugeridos

1. Resolver o checklist de conteúdo.
2. Rodar as validações e o build.
3. Deploy na Vercel (ver `deployment.md`).
4. (Opcional) Ativar analytics e consentimento de cookies.
