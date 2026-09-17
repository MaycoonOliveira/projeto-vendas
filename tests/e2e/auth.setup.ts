import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/admin.json";

/**
 * Autentica o admin de E2E (usuário isolado, credenciais em .env.local gitignored) e salva a
 * sessão em storageState para reuso pelos projetos `admin-*`. A senha nunca aparece no log.
 */
setup("authenticate admin", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD ausentes (.env.local).");
  }

  await page.goto("/admin/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/admin", { timeout: 60_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
