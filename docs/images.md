# Imagens

## Onde ficam

- Arquivos: `public/images/*.avif` (29 fotos).
- Referências e textos alternativos: `src/data/gallery.ts`.

## ⚠️ Direitos de uso (importante)

As imagens atuais podem ter origem em **plataforma de terceiros** (anúncio). **Não
assuma autorização de uso comercial.** Antes de publicar:

1. Confirme com o proprietário a autorização de uso, **ou**
2. Substitua pelas versões oficiais cedidas por ele.

A arquitetura foi feita para a **troca ser simples** — veja abaixo.

## Como substituir

1. Adicione as novas imagens em `public/images/` (nomes à sua escolha).
2. Em `src/data/gallery.ts`, atualize cada `src` e o respectivo `alt`.
3. A ordem do array define os destaques: os **primeiros itens** são os de maior
   impacto (fachada, piscina, deck, vistas) e ocupam as posições de destaque do
   mosaico. `heroImage` = primeiro item; `About`, `Acomodações` e a faixa de CTA
   usam índices específicos (2, 6 e 3, respectivamente).

## Boas práticas

- Prefira **AVIF** ou **WebP** (menor peso, boa qualidade).
- Fotos horizontais (paisagem) funcionam melhor no hero e nas faixas largas.
- Mantenha resolução alta o suficiente (largura ~2000px) — o `next/image` gera
  os tamanhos responsivos automaticamente (`next.config.ts`).
- Escreva `alt` descritivo e verdadeiro (acessibilidade + SEO).

## Otimização

O `next/image` está configurado para servir `avif`/`webp` e gerar `srcset`
responsivo. O hero usa `priority`; as demais carregam com lazy loading.

## Curadoria atual (resumo)

As fotos foram classificadas visualmente em: externas/piscina/vistas (destaques),
ambientes internos (living/cozinha/jantar), quartos e banheiros — e ordenadas em
`gallery.ts` para que as mais impactantes apareçam primeiro.
