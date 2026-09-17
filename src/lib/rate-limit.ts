/**
 * Rate limiter simples em memória (janela deslizante fixa por chave).
 *
 * ⚠️ Best-effort e POR INSTÂNCIA: em serverless (várias lambdas) o estado não é compartilhado,
 * então isto reduz abuso trivial mas não é uma garantia forte. O plano prevê um store persistente
 * (Postgres) como evolução não-bloqueante — este helper é o ponto de troca. O rate limit de
 * autenticação já é feito pelo Better Auth; aqui cobrimos os endpoints públicos (disponibilidade).
 */
type Bucket = { count: number; resetAt: number };

const globalForRl = globalThis as unknown as {
  __casaCarramRl?: Map<string, Bucket>;
};

function store(): Map<string, Bucket> {
  if (!globalForRl.__casaCarramRl) globalForRl.__casaCarramRl = new Map();
  return globalForRl.__casaCarramRl;
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Segundos até a janela reabrir (para o header `Retry-After`). */
  retryAfter: number;
};

/**
 * Consome 1 token para `key`. Permite `limit` requisições a cada `windowSeconds`.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const buckets = store();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { ok: true, remaining: limit - current.count, retryAfter: 0 };
}

/** Extrai o IP do cliente dos headers de proxy (Vercel/Supabase). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
