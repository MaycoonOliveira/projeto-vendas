import { test, expect } from "@playwright/test";

test.describe("navegação desktop", () => {
  test.skip(
    ({ isMobile }) => !!isMobile,
    "menu de navegação fica no drawer no mobile",
  );

  const steps: Array<{ link: string; url: RegExp }> = [
    { link: "A Casa", url: /\/acomodacoes$/ },
    { link: "Galeria", url: /\/galeria$/ },
    { link: "Localização", url: /\/localizacao$/ },
    { link: "Contato", url: /\/contato$/ },
  ];

  test("navega pelos links principais da navbar", async ({ page }) => {
    for (const step of steps) {
      await page.goto("/");
      const nav = page.getByRole("navigation", { name: /navegação principal/i });
      await nav.getByRole("link", { name: step.link, exact: true }).click();
      await page.waitForURL(step.url, { timeout: 15_000 });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });
});

test.describe("menu mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "somente no viewport mobile");

  test("abre o drawer e navega", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /abrir menu/i }).click();

    const dialog = page.getByRole("dialog", { name: /^menu$/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("link", { name: "Galeria" }).click();
    await expect(page).toHaveURL(/\/galeria$/);
    await expect(dialog).not.toBeVisible();
  });
});
