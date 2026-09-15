import { test, expect } from "@playwright/test";

test("a galeria abre o lightbox, navega e fecha", async ({ page }) => {
  await page.goto("/galeria");

  // Abre a primeira imagem
  await page.getByRole("button", { name: /ampliar imagem/i }).first().click();

  const dialog = page.getByRole("dialog", { name: /imagem \d+ de \d+/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/^\s*1 \/ \d+\s*$/)).toBeVisible();

  // Avança para a próxima
  await dialog.getByRole("button", { name: /próxima imagem/i }).click();
  await expect(dialog.getByText(/^\s*2 \/ \d+\s*$/)).toBeVisible();

  // Fecha
  await dialog.getByRole("button", { name: /fechar galeria/i }).click();
  await expect(dialog).toBeHidden();
});
