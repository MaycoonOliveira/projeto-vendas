import { randomBytes } from "node:crypto";

/**
 * Gera o `public_code` da reserva: **capability** aleatória de ~128 bits (16 bytes), não
 * sequencial e não enumerável (anti-IDOR). Codificação base32 de Crockford (sem I/L/O/U — evita
 * ambiguidade se lido/digitado), maiúscula, 26 caracteres. É um segredo de baixa sensibilidade:
 * quem tem o código vê a reserva (por isso a página é `noindex` e expõe só o mínimo).
 */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32

export function generatePublicCode(): string {
  const bytes = randomBytes(16);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += ALPHABET[(value >>> bits) & 31];
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** Formato esperado do código (para validar a rota pública antes de consultar o banco). */
export const PUBLIC_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function isValidPublicCode(code: string): boolean {
  return PUBLIC_CODE_RE.test(code);
}
