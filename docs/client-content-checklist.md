# Checklist de conteúdo do cliente

Itens que **precisam ser confirmados/substituídos** antes de publicar. Procure
por `TODO_CLIENTE` no código para localizá-los rapidamente.

## 1. Contato (obrigatório) — `src/config/site.ts`

- [ ] **WhatsApp**: `contact.whatsapp` — hoje é `5524999999999` (**placeholder**).
      Formato: só dígitos, com DDI+DDD (ex.: `5524999998888`).
- [ ] **Telefone**: `contact.phoneDisplay` e `contact.phoneE164`.
- [ ] **E-mail**: `contact.email` (hoje `contato@casacarram.com.br`).
- [ ] Revisar a **mensagem padrão** do WhatsApp (`contact.whatsappMessage`).

## 2. Domínio e SEO (obrigatório)

- [ ] Definir **`NEXT_PUBLIC_SITE_URL`** no ambiente (domínio final, sem barra).
- [ ] Conferir `url` em `src/config/site.ts` (fallback).

## 3. Localização — `src/config/site.ts`

- [ ] **Endereço**: `location.addressLine` está como "enviado após a reserva".
      Decidir se exibe o endereço completo ou mantém assim.
- [ ] (Opcional) Ajustar coordenadas/consulta do mapa se desejar precisão.

## 4. Reservas e valores — `src/config/site.ts`

- [ ] (Opcional) **Diária/valores**: `booking.priceFrom` (hoje `null` = "sob
      consulta"). Só preencha se quiser exibir preço.
- [ ] (Opcional) **Reserva direta/Booking**: `booking.directUrl`.
- [x] Link do **Airbnb** já configurado (real).

## 5. Redes sociais — `src/config/site.ts`

- [ ] `socials.instagram` / `socials.facebook` (aparecem no rodapé quando
      preenchidos).

## 6. Imagens — `src/data/gallery.ts` + `public/images/`

- [ ] **Confirmar autorização de uso comercial** das fotos atuais **ou
      substituí-las** pelas versões oficiais. Ver `docs/images.md`.

## 7. Depoimentos — `src/data/testimonials.ts`

- [ ] (Opcional) Adicionar **citações reais e autorizadas** de hóspedes. Sem
      isso, o site mostra apenas o agregado real (5,0 · Favorito dos hóspedes).

## 8. FAQ e políticas — `src/data/faq.ts`

- [ ] Preencher as **políticas reais**: check-in/check-out, regras da casa,
      animais de estimação, cancelamento.

## 9. Textos legais (revisar juridicamente)

- [ ] **Termos de Uso** (`src/app/termos/page.tsx`) — modelo; revisar e datar.
- [ ] **Política de Privacidade** (`src/app/politica-de-privacidade/page.tsx`) —
      modelo LGPD; revisar, datar e nomear o responsável/controlador.
- [ ] Remover o componente `LegalNotice` das páginas após a validação.

## 10. Identidade (opcional)

- [ ] `legalName` (razão social/responsável) em `src/config/site.ts`.
- [ ] Substituir o favicon (`src/app/icon.svg`) por um logo definitivo, se houver.

## 11. Analytics (opcional)

- [ ] Instalar GA4/GTM e ligar aos eventos já preparados. Ver `docs/seo.md`.
      Ao coletar dados, adicionar banner de consentimento e atualizar a política.
