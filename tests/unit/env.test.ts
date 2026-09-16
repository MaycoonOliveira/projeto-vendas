import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `getEnv()` é memoizado no módulo, então cada teste recarrega o módulo com `vi.resetModules()`
 * e restaura as variáveis de ambiente ao final.
 */
const saved = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (saved.DATABASE_URL === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = saved.DATABASE_URL;
  if (saved.DIRECT_URL === undefined) delete process.env.DIRECT_URL;
  else process.env.DIRECT_URL = saved.DIRECT_URL;
});

async function loadEnv() {
  return import("@/lib/env");
}

describe("getEnv", () => {
  it("valida e retorna DATABASE_URL quando presente", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@host:6543/postgres";
    delete process.env.DIRECT_URL;

    const { getEnv } = await loadEnv();
    expect(getEnv().DATABASE_URL).toBe("postgres://user:pass@host:6543/postgres");
  });

  it("lança erro legível mencionando DATABASE_URL quando ela falta", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;

    const { getEnv } = await loadEnv();
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });
});

describe("getMigrationConnectionString", () => {
  it("prefere DIRECT_URL (session mode) quando presente", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@host:6543/postgres";
    process.env.DIRECT_URL = "postgres://user:pass@host:5432/postgres";

    const { getMigrationConnectionString } = await loadEnv();
    expect(getMigrationConnectionString()).toBe(
      "postgres://user:pass@host:5432/postgres",
    );
  });

  it("cai para DATABASE_URL quando DIRECT_URL está ausente", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@host:6543/postgres";
    delete process.env.DIRECT_URL;

    const { getMigrationConnectionString } = await loadEnv();
    expect(getMigrationConnectionString()).toBe(
      "postgres://user:pass@host:6543/postgres",
    );
  });
});
