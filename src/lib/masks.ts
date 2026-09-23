/**
 * Máscaras de entrada (PURAS — client-safe, sem dependências). Formatam apenas a exibição do
 * texto enquanto o usuário digita; o valor continua sendo uma string comum que os validadores
 * (Zod no servidor) aceitam. Nenhuma máscara é "travada": se o valor não casar o padrão, o
 * texto é apenas parcialmente formatado, sem bloquear a digitação nem o envio do formulário.
 */

/** Telefone BR local: `(DD) 9XXXX-XXXX` (celular, 11 díg.) ou `(DD) XXXX-XXXX` (fixo, 10 díg.). */
export function maskPhoneBR(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** WhatsApp com DDI Brasil: `+55 (DD) 9XXXX-XXXX`. Aceita colar já com 55 (é removido e
 *  reaplicado). Usado nos campos de contato das Configurações (viram links wa.me/Z-API). */
export function maskWhatsappBR(value: string): string {
  let d = value.replace(/\D/g, "");
  if (d.startsWith("55") && d.length > 11) d = d.slice(2); // tira DDI colado para reformatar
  const local = maskPhoneBR(d);
  return local ? `+55 ${local}` : "";
}

/** CNPJ: `00.000.000/0000-00`. */
export function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  let out = d;
  if (d.length > 2) out = `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length > 5) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 8) out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 12)
    out = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return out;
}

/** CEP: `00000-000`. */
export function maskCEP(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/**
 * Dígitos E.164 (sem `+`) de um telefone BR para montar `wa.me`/Z-API. Se não vier com DDI e
 * tiver 10–11 dígitos (fixo/celular com DDD), prefixa `55`. Tolerante a máscara/espaços.
 */
export function brPhoneToWaDigits(value: string): string {
  let d = (value ?? "").replace(/\D/g, "");
  if ((d.length === 10 || d.length === 11) && !d.startsWith("55")) d = `55${d}`;
  return d;
}
