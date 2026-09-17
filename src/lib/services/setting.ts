import { sql } from "drizzle-orm";

import { db } from "@/db";
import { setting } from "@/db/schema";

/**
 * Configurações operacionais (Fase 6). Leitura/escrita — só o painel autenticado. Os metadados de
 * UI ficam em `@/lib/settings-fields` (puro, importável por Client Components).
 */
export { SETTING_FIELDS, type SettingKey } from "@/lib/settings-fields";

export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(setting);
  const out: Record<string, string> = {};
  for (const row of rows) {
    out[row.key] = typeof row.value === "string" ? row.value : String(row.value ?? "");
  }
  return out;
}

/** Upsert de uma configuração (idempotente por `key`). */
export async function setSetting(
  key: string,
  value: string,
  adminId?: string | null,
): Promise<void> {
  await db
    .insert(setting)
    .values({ key, value, updatedByAdminId: adminId ?? null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: setting.key,
      set: { value, updatedByAdminId: adminId ?? null, updatedAt: sql`now()` },
    });
}
