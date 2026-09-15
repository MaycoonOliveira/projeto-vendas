import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/acomodacoes",
  "/galeria",
  "/localizacao",
  "/contato",
  "/termos",
  "/politica-de-privacidade",
];

for (const route of routes) {
  test(`a rota ${route} carrega com sucesso e tem um H1`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status(), `status de ${route}`).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("a rota 404 exibe página de erro amigável", async ({ page }) => {
  const response = await page.goto("/rota-que-nao-existe");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: /não encontrada/i }),
  ).toBeVisible();
});
