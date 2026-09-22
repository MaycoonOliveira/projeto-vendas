import "server-only";

/**
 * Upload de imagens para o Supabase Storage via **REST API** (sem SDK), usando a service role key.
 * Fase 18. Bucket público `accommodation-photos`. Validação por content-type + magic bytes + tamanho.
 * Requer env `SUPABASE_URL` e `SERVICE_ROLE_KEY` (só no servidor — nunca no cliente).
 */
const BUCKET = "accommodation-photos";
const MAX_BYTES = 6 * 1024 * 1024; // 6MB

/** Ref do projeto contido no claim `ref` do JWT `SERVICE_ROLE_KEY` (payload público, não a
 *  assinatura). É a fonte de verdade: o host de storage TEM que ser o projeto para o qual a chave
 *  foi assinada — senão o Supabase rejeita com "signature verification failed" (AccessDenied). */
function refFromServiceKey(key: string | undefined): string | null {
  if (!key) return null;
  const parts = key.split(".");
  if (parts.length !== 3) return null; // não é JWT (ex.: nova chave "secret"/publishable)
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return typeof payload.ref === "string" && /^[a-z0-9]+$/i.test(payload.ref)
      ? payload.ref
      : null;
  } catch {
    return null;
  }
}

/** URL do projeto Supabase para o Storage.
 *  Prioridade: (1) o **ref da própria SERVICE_ROLE_KEY** — garante que a URL casa com a chave e
 *  evita "signature verification failed" quando SUPABASE_URL aponta para OUTRO projeto; (2) um
 *  SUPABASE_URL http(s) explícito; (3) o ref do usuário do pooler (`postgres.<ref>`) em
 *  DATABASE_URL/DIRECT_URL. */
function resolveProjectUrl(): string | null {
  const keyRef = refFromServiceKey(process.env.SERVICE_ROLE_KEY);
  if (keyRef) return `https://${keyRef}.supabase.co`;

  const raw = process.env.SUPABASE_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw.replace(/\/+$/, "");

  const conn = process.env.DATABASE_URL ?? process.env.DIRECT_URL ?? "";
  try {
    const username = decodeURIComponent(new URL(conn).username);
    const m = username.match(/^postgres\.([a-z0-9]+)$/i);
    if (m) return `https://${m[1]}.supabase.co`;
  } catch {
    /* ignore */
  }
  return null;
}

function storageEnv(): { url: string; key: string } | null {
  const url = resolveProjectUrl();
  const key = process.env.SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function storageConfigured(): boolean {
  return storageEnv() !== null;
}

/** Detecta o tipo real pela assinatura (magic bytes) — não confia na extensão/type informado. */
function sniffImage(b: Uint8Array): string | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  // Caixa ISO-BMFF "ftyp" → avif/heic.
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
  }
  return null;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Cria o bucket público se ainda não existir (idempotente; ignora "já existe"). */
async function ensureBucket(env: { url: string; key: string }): Promise<void> {
  try {
    await fetch(`${env.url}/storage/v1/bucket`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.key}`,
        apikey: env.key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
    });
  } catch {
    // silencioso — se já existe, o POST retorna erro que ignoramos
  }
}

/** Código de falha do upload — o chamador mapeia para uma mensagem legível ao usuário. */
export type UploadErrorCode =
  | "not_configured"
  | "empty"
  | "too_large"
  | "not_image"
  | "upload_failed";
export type UploadResult =
  | { url: string }
  | { error: string; code: UploadErrorCode };

export async function uploadImage(file: File): Promise<UploadResult> {
  const env = storageEnv();
  if (!env)
    return { error: "Armazenamento não configurado.", code: "not_configured" };
  if (!file || file.size === 0) return { error: "Arquivo vazio.", code: "empty" };
  if (file.size > MAX_BYTES)
    return { error: "Imagem acima de 6MB.", code: "too_large" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type)
    return {
      error: "Arquivo não é uma imagem válida (JPG, PNG, WEBP, AVIF ou GIF).",
      code: "not_image",
    };

  await ensureBucket(env);
  const path = `${crypto.randomUUID()}.${EXT[type]}`;
  const res = await fetch(`${env.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.key}`,
      apikey: env.key,
      "Content-Type": type,
      "cache-control": "3600",
    },
    body: bytes,
  });
  if (!res.ok) {
    console.error("[storage] upload falhou:", res.status, await res.text().catch(() => ""));
    return { error: `Falha no upload (${res.status}).`, code: "upload_failed" };
  }
  return { url: `${env.url}/storage/v1/object/public/${BUCKET}/${path}` };
}

/** Remove do storage um objeto que pertença ao nosso bucket (best-effort). */
export async function deleteImageByUrl(url: string): Promise<void> {
  const env = storageEnv();
  if (!env) return;
  const prefix = `${env.url}/storage/v1/object/public/${BUCKET}/`;
  if (!url.startsWith(prefix)) return; // foto por URL externa — não é nossa
  const path = url.slice(prefix.length);
  try {
    await fetch(`${env.url}/storage/v1/object/${BUCKET}/${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${env.key}`, apikey: env.key },
    });
  } catch {
    // best-effort
  }
}
