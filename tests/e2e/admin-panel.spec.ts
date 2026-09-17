import { test, expect } from "@playwright/test";

/**
 * E2E do painel autenticado (roda nos projetos `admin-desktop` e `admin-mobile`, que já vêm com
 * a sessão de storageState). Cobrem só leitura/navegação — sem mutação de dados.
 */

test("dashboard operacional carrega com KPIs", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Olá");
  // KPIs do centro de operação.
  await expect(page.getByText("Chegadas hoje")).toBeVisible();
  await expect(page.getByText("Saídas hoje")).toBeVisible();
  await expect(page.getByText("Próximos 14 dias")).toBeVisible();
});

test("lista de reservas + busca", async ({ page }) => {
  await page.goto("/admin/reservas");
  await expect(page.getByRole("heading", { name: "Reservas" })).toBeVisible();
  const search = page.getByPlaceholder("Buscar por hóspede ou código");
  await expect(search).toBeVisible();
  await search.fill("ZZZINEXISTENTE");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page.getByText("Nenhuma reserva encontrada")).toBeVisible();
});

test("navegação mobile: menu hambúrguer abre o drawer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "admin-mobile", "Só no viewport mobile");
  await page.goto("/admin");
  const openBtn = page.getByRole("button", { name: "Abrir menu" });
  await expect(openBtn).toBeVisible();
  await openBtn.click();
  const drawer = page.getByRole("dialog", { name: "Menu do painel" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Reservas" })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Calendário" })).toBeVisible();
});

test("navegação desktop: links visíveis no header", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "admin-desktop", "Só no viewport desktop");
  await page.goto("/admin");
  await expect(
    page.getByRole("navigation", { name: "Navegação admin" }).getByRole("link", { name: "Reservas" }),
  ).toBeVisible();
});
