import "server-only";

import { getSettingsMap } from "@/lib/services/setting";

/**
 * Notificação de WhatsApp SERVER-SIDE ao admin (FIX 3) — via Z-API (api comum no Brasil).
 *
 * Config (settings da pousada OU variáveis de ambiente; env tem precedência p/ os segredos):
 *   - Instância:  setting `zapi_instance_id`  | env `ZAPI_INSTANCE_ID`
 *   - Token:      setting `zapi_token`         | env `ZAPI_TOKEN`
 *   - Telefone:   setting `whatsapp_notify_phone` | env `ZAPI_PHONE`  (com DDI, ex.: +55 24 9…)
 *   - (opcional)  env `ZAPI_CLIENT_TOKEN` — "Account Security Token" da Z-API (header Client-Token).
 *
 * BEST-EFFORT: se não estiver configurado, loga um aviso e retorna SEM lançar — nunca bloqueia a
 * reserva do hóspede. Erros de rede/HTTP são engolidos (apenas logados).
 */
type ZapiConfig = {
  instanceId: string;
  token: string;
  phone: string;
  clientToken?: string;
};

const onlyDigits = (s: string) => s.replace(/\D/g, "");

async function resolveConfig(): Promise<ZapiConfig | null> {
  let settings: Record<string, string> = {};
  try {
    settings = await getSettingsMap();
  } catch {
    // sem DB/settings — cai para env
  }
  const instanceId = (
    process.env.ZAPI_INSTANCE_ID ??
    settings.zapi_instance_id ??
    ""
  ).trim();
  const token = (process.env.ZAPI_TOKEN ?? settings.zapi_token ?? "").trim();
  const phoneRaw = (
    process.env.ZAPI_PHONE ??
    settings.whatsapp_notify_phone ??
    ""
  ).trim();
  const phone = onlyDigits(phoneRaw);
  const clientToken = process.env.ZAPI_CLIENT_TOKEN?.trim() || undefined;

  if (!instanceId || !token || !phone) return null;
  return { instanceId, token, phone, clientToken };
}

/** Envia uma mensagem de texto ao admin. Best-effort: nunca lança. Retorna se enviou. */
export async function sendWhatsAppToAdmin(message: string): Promise<boolean> {
  const cfg = await resolveConfig();
  if (!cfg) {
    console.warn(
      "[whatsapp-notify] Z-API não configurado (zapi_instance_id/zapi_token/whatsapp_notify_phone). Aviso ignorado.",
    );
    return false;
  }
  const url = `https://api.z-api.io/instances/${cfg.instanceId}/token/${cfg.token}/send-text`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.clientToken ? { "Client-Token": cfg.clientToken } : {}),
      },
      body: JSON.stringify({ phone: cfg.phone, message }),
    });
    if (!res.ok) {
      console.error(
        "[whatsapp-notify] envio falhou:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (e) {
    console.error(
      "[whatsapp-notify] erro de rede:",
      e instanceof Error ? e.message : e,
    );
    return false;
  }
}

/** Monta a mensagem padrão de "nova reserva" (FIX 3). */
export function newReservationMessage(input: {
  publicCode: string;
  accommodationName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsCount: number;
  totalBRL: string;
}): string {
  const noun = input.nights === 1 ? "noite" : "noites";
  return [
    "─ NOVA RESERVA ─",
    `Código: ${input.publicCode}`,
    "Status: Pendente",
    `Acomodação: ${input.accommodationName}`,
    `Período: ${input.checkIn} → ${input.checkOut} (${input.nights} ${noun})`,
    `Hóspedes: ${input.guestsCount}`,
    `Total: ${input.totalBRL}`,
    "─────────────────",
    "Reserva pendente. Confirme por contato com instruções de pagamento. Fica reservada por 24h.",
  ].join("\n");
}
