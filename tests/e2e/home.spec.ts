import { test, expect, type ConsoleMessage } from "@playwright/test";

const AIRBNB_URL = "https://www.airbnb.pt/rooms/1688073569848326515";

/** Ignora ruídos de console vindos de recursos externos (ex.: iframe do Maps). */
function isRelevantError(msg: ConsoleMessage) {
  if (msg.type() !== "error") return false;
  const text = msg.text().toLowerCase();
  const externalNoise = ["google", "gstatic", "maps", "favicon"];
  return !externalNoise.some((n) => text.includes(n));
}

test("a home carrega com título e hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Casa Carram/i);
  await expect(
    page.getByRole("heading", { level: 1, name: /apaixonar/i }),
  ).toBeVisible();
});

test("a home não registra erros críticos no console", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (isRelevantError(msg)) errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test("o CTA de reserva aponta para o anúncio oficial", async ({ page }) => {
  await page.goto("/");
  const reserve = page.getByRole("link", { name: /reservar agora/i }).first();
  await expect(reserve).toHaveAttribute("href", AIRBNB_URL);
  await expect(reserve).toHaveAttribute("target", "_blank");
});

test("os links de WhatsApp usam o formato wa.me", async ({ page }) => {
  await page.goto("/");
  const whats = page.getByRole("link", { name: /whatsapp/i }).first();
  await expect(whats).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
});
