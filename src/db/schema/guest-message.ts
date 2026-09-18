import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { guest } from "./guest";
import { user } from "./auth";

/**
 * `guest_message` — registro de comunicações com o hóspede (Fase 19, mensageria V1).
 *
 * V1 é um **histórico de comunicações** (o admin registra o que foi trocado por WhatsApp/e-mail/
 * telefone, ou uma nota interna) — não é chat em tempo real (isso exige login do hóspede = V2).
 * Dá à equipe um fio da conversa por hóspede.
 */
export const GUEST_MESSAGE_CHANNELS = ["WHATSAPP", "EMAIL", "PHONE", "NOTE"] as const;
export const GUEST_MESSAGE_DIRECTIONS = ["OUT", "IN"] as const;

export const guestMessage = pgTable(
  "guest_message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guest.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    direction: text("direction").notNull().default("OUT"),
    body: text("body").notNull(),
    createdByAdminId: text("created_by_admin_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("guest_message_guest_idx").on(t.guestId, t.createdAt),
    check("guest_message_channel_valid", sql`${t.channel} in ('WHATSAPP','EMAIL','PHONE','NOTE')`),
    check("guest_message_direction_valid", sql`${t.direction} in ('OUT','IN')`),
  ],
);
