import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * `guest` — hóspede (Fase 5). **Minimização LGPD**: só o necessário para solicitar a reserva e
 * contatar (nome, e-mail, telefone, observações). **Sem CPF/documento aqui** — isso é do
 * pré-check-in (`guest_profile`, fase futura). Reuso por e-mail (case-insensitive) no serviço.
 */
export const guest = pgTable(
  "guest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Índice funcional `lower(email)` para o reuso case-insensitive é adicionado via SQL na
  // migration (Drizzle não modela índice de expressão). Ver drizzle/0004_*.sql.
);
