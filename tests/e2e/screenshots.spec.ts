/**
 * Script de captura de screenshots para documentação UX/UI — Lovable.
 * Roda com: npx playwright test tests/e2e/screenshots.spec.ts --project=desktop
 * Outputs: docs/lovable/screenshots/
 */
import { test } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS_DIR = path.resolve("docs/lovable/screenshots");
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const ss = (name: string) => path.join(SCREENSHOTS_DIR, `${name}.png`);

test.describe("Site Público — Desktop", () => {
  test("home-hero", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("home-hero"), clip: { x: 0, y: 0, width: 1280, height: 700 } });
  });

  test("home-about", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#a-casa").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: ss("home-about"), clip: { x: 0, y: 0, width: 1280, height: 700 } });
  });

  test("home-differentials", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByText("Feita para momentos que ficam").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: ss("home-differentials"), clip: { x: 0, y: 0, width: 1280, height: 700 } });
  });

  test("home-accommodations", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#acomodacoes").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: ss("home-accommodations"), clip: { x: 0, y: 0, width: 1280, height: 700 } });
  });

  test("home-amenities", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#comodidades").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: ss("home-amenities"), clip: { x: 0, y: 0, width: 1280, height: 700 } });
  });

  test("home-faq", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#faq").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: ss("home-faq"), clip: { x: 0, y: 0, width: 1280, height: 700 } });
  });

  test("home-cta-band", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByText("Pronto para desacelerar").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: ss("home-cta-band"), clip: { x: 0, y: 0, width: 1280, height: 500 } });
  });

  test("navbar-transparent", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("navbar-transparent"), clip: { x: 0, y: 0, width: 1280, height: 90 } });
  });

  test("navbar-solid", async ({ page }) => {
    await page.goto("/acomodacoes");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: ss("navbar-solid"), clip: { x: 0, y: 0, width: 1280, height: 90 } });
  });

  test("acomodacoes", async ({ page }) => {
    await page.goto("/acomodacoes");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: ss("acomodacoes"), fullPage: false });
  });

  test("galeria", async ({ page }) => {
    await page.goto("/galeria");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: ss("galeria"), clip: { x: 0, y: 0, width: 1280, height: 900 } });
  });

  test("galeria-lightbox", async ({ page }) => {
    await page.goto("/galeria");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.locator("ul button").first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: ss("galeria-lightbox") });
  });

  test("localizacao", async ({ page }) => {
    await page.goto("/localizacao");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: ss("localizacao") });
  });

  test("contato", async ({ page }) => {
    await page.goto("/contato");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("contato") });
  });

  test("reservar-step1", async ({ page }) => {
    await page.goto("/reservar");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("reservar-step1") });
  });

  test("admin-login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-login") });
  });
});

test.describe("Site Público — Mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile-home-hero", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("mobile-home-hero"), clip: { x: 0, y: 0, width: 375, height: 812 } });
  });

  test("mobile-navbar-drawer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Abrir menu").click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: ss("mobile-navbar-drawer") });
  });

  test("mobile-reservar", async ({ page }) => {
    await page.goto("/reservar");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("mobile-reservar") });
  });

  test("mobile-galeria", async ({ page }) => {
    await page.goto("/galeria");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: ss("mobile-galeria"), clip: { x: 0, y: 0, width: 375, height: 812 } });
  });
});

test.describe("Admin — Desktop", () => {
  // Nota: O admin requer autenticação. Se não estiver logado, vai redirecionar para /admin/login.
  // Para capturar telas autenticadas, é necessário ter um usuário admin criado via seed.

  test("admin-dashboard", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-dashboard") });
  });

  test("admin-reservas", async ({ page }) => {
    await page.goto("/admin/reservas");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-reservas") });
  });

  test("admin-calendario", async ({ page }) => {
    await page.goto("/admin/calendario");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-calendario") });
  });

  test("admin-bloqueios", async ({ page }) => {
    await page.goto("/admin/bloqueios");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-bloqueios") });
  });

  test("admin-hospedes", async ({ page }) => {
    await page.goto("/admin/hospedes");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-hospedes") });
  });

  test("admin-acomodacoes", async ({ page }) => {
    await page.goto("/admin/acomodacoes");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-acomodacoes") });
  });

  test("admin-configuracoes", async ({ page }) => {
    await page.goto("/admin/configuracoes");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ss("admin-configuracoes") });
  });
});
