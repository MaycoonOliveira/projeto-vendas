import { z } from "zod";

/**
 * Validação das variáveis de ambiente do servidor (Fase 1 — Fundação).
 *
 * Regras:
 * - Segredos NUNCA usam o prefixo `NEXT_PUBLIC_` (não podem ser inlined no bundle do cliente).
 * - Validação é preguiçosa (`getEnv()`), para não quebrar `build`/testes quando o banco ainda
 *   não está configurado. Onde o banco é realmente necessário, o import de `@/db` dispara a
 *   validação e falha cedo com mensagem clara.
 *
 * Este módulo é puro (sem `server-only`) de propósito: também é lido pelo `drizzle.config.ts`,
 * que roda fora do runtime do Next.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  /**
   * Conexão de runtime da aplicação — pooler de transação do Supabase (Supavisor).
   * O cliente usa `prepare: false` por causa do transaction pooling.
   */
  DATABASE_URL: z.string().trim().min(1, "DATABASE_URL é obrigatória"),

  /**
   * Conexão direta / session mode — usada para MIGRATIONS (prepared statements ok).
   * Quando ausente, o fluxo de migration cai para `DATABASE_URL`.
   */
  DIRECT_URL: z.string().trim().min(1).optional(),

  /**
   * Better Auth (Fase 2). Opcionais no schema para não quebrar `build`/migrations quando
   * a auth ainda não é exercida; `getAuthEnv()` exige-os onde a auth realmente roda.
   */
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().min(1).optional(),

  /**
   * E-mail transacional (Resend). Opcionais: sem `RESEND_API_KEY`, o envio faz fallback para
   * log no servidor (dev), sem quebrar o fluxo (útil antes de verificar o domínio remetente).
   */
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Retorna o ambiente validado (memoizado). Lança erro legível se algo faltar. */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(raiz)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

/** String de conexão a usar em migrations (direta/session mode; cai para DATABASE_URL). */
export function getMigrationConnectionString(): string {
  const env = getEnv();
  return env.DIRECT_URL ?? env.DATABASE_URL;
}

/** Env exigido pela camada de autenticação. Lança erro claro se algo faltar. */
export function getAuthEnv(): { secret: string; baseURL: string } {
  const env = getEnv();
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET é obrigatória para a autenticação.");
  }
  return {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
  };
}
