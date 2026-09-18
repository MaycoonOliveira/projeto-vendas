import { sql } from "drizzle-orm";
import { check, date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * `guest` — hóspede (Fase 5 + CRM na Fase 17).
 *
 * O formulário público de reserva coleta o mínimo (nome, e-mail, telefone, observações — LGPD).
 * Os campos de CRM (documento, nascimento, status) são preenchidos **pelo admin** no perfil do
 * hóspede — dados sensíveis, acesso restrito ao painel autenticado (nunca via `public_code`).
 */
export const GUEST_STATUSES = ["NORMAL", "VIP", "BLACKLIST"] as const;
export type GuestStatus = (typeof GUEST_STATUSES)[number];

export const guest = pgTable(
  "guest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes"),
    // CRM (Fase 17) — preenchido pelo admin.
    documentType: text("document_type"),
    documentNumber: text("document_number"),
    birthDate: date("birth_date", { mode: "string" }),
    status: text("status").notNull().default("NORMAL"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Índice funcional `lower(email)` para o reuso case-insensitive é adicionado via SQL na
  // migration (Drizzle não modela índice de expressão). Ver drizzle/0004_*.sql.
  (t) => [
    check("guest_status_valid", sql`${t.status} in ('NORMAL','VIP','BLACKLIST')`),
    check(
      "guest_document_type_valid",
      sql`${t.documentType} is null or ${t.documentType} in ('CPF','PASSPORT','OTHER')`,
    ),
  ],
);
