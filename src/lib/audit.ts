import { db } from "@/db";
import { auditLog } from "@/db/schema";

/**
 * Grava um evento de auditoria (append-only). `metadata` NUNCA deve conter PII sensível
 * (senhas, tokens, documentos). Use `id`/`slug` para referenciar entidades.
 */
export type AuditInput = {
  actorType: "USER" | "SYSTEM" | "GUEST";
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

export async function writeAudit(input: AuditInput): Promise<void> {
  await db.insert(auditLog).values({
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
  });
}
