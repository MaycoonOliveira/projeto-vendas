/**
 * Metadados de UI das configurações (PURO — sem importar o banco). Pode ser usado por Client
 * Components. A lógica de leitura/escrita fica em `@/lib/services/setting`.
 */
export const SETTING_FIELDS = [
  { key: "checkin_time", label: "Horário de check-in", type: "text" as const },
  { key: "checkout_time", label: "Horário de check-out", type: "text" as const },
  { key: "contact_whatsapp", label: "WhatsApp de contato", type: "text" as const },
  {
    key: "cancellation_policy",
    label: "Política de cancelamento",
    type: "textarea" as const,
  },
] as const;

export type SettingKey = (typeof SETTING_FIELDS)[number]["key"];
