import { test, expect } from "@playwright/test";

/**
 * Fluxo público de reserva (site) — datas → disponibilidade → seleção → formulário de hóspede.
 * NÃO envia (evita criar reserva real). Roda nos projetos públicos (desktop/mobile).
 */
test("consulta disponibilidade e chega ao formulário de hóspede", async ({ page }) => {
  await page.goto("/reservar");
  await expect(page.getByRole("heading", { name: /Consulte disponibilidade/i })).toBeVisible();

  // Define as datas via o setter nativo do input (o date-picker é do navegador, não do nosso
  // código) para garantir que o estado controlado do React receba o valor de forma confiável.
  const setDate = async (sel: string, value: string) => {
    await page.$eval(
      sel,
      (el, v) => {
        const input = el as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(input),
          "value",
        )?.set;
        setter?.call(input, v);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      },
      value,
    );
  };
  await setDate("#checkin", "2028-11-10");
  await setDate("#checkout", "2028-11-13");
  await expect(page.locator("#checkin")).toHaveValue("2028-11-10");

  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/disponibilidade"), {
      timeout: 60_000,
    }),
    page.getByRole("button", { name: "Ver disponibilidade" }).click(),
  ]);
  expect(resp.status()).toBe(200);

  // Resultado: botão Reservar da Casa.
  const reservar = page.getByRole("button", { name: "Reservar" }).first();
  await expect(reservar).toBeVisible({ timeout: 45_000 });
  await reservar.click();

  // Passo 3: dados do hóspede.
  await expect(page.locator("#fullName")).toBeVisible();
  await expect(page.getByRole("button", { name: "Solicitar reserva" })).toBeVisible();
});
