import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Carrega .env.local (credenciais de E2E_ADMIN_* ficam aqui, gitignored).
loadEnvConfig(process.cwd());

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const AUTH_FILE = "playwright/.auth/admin.json";

// Specs de admin exigem sessão (storageState). Specs públicas rodam sem auth.
const ADMIN_MATCH = /admin-.*\.spec\.ts/;
const IGNORE_PUBLIC = [/auth\.setup\.ts/, ADMIN_MATCH, /screenshots\.spec\.ts/];

export default defineConfig({
  testDir: "./tests/e2e",
  // Serial (1 worker): a suite compartilha o banco Supabase free (cold-start). Rodar em paralelo
  // martela o pool e gera flakiness de timeout. Serial + warm é confiável; a suite é pequena.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  // Cold-start do Supabase free pode deixar a 1ª consulta lenta → timeout de teste generoso.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    actionTimeout: 45_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: IGNORE_PUBLIC,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testIgnore: IGNORE_PUBLIC,
    },
    {
      name: "admin-desktop",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      testMatch: ADMIN_MATCH,
      dependencies: ["setup"],
    },
    {
      name: "admin-mobile",
      use: { ...devices["Pixel 5"], storageState: AUTH_FILE },
      testMatch: ADMIN_MATCH,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
