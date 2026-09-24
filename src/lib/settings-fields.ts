/**
 * Metadados de UI das configurações (PURO — sem importar o banco). Pode ser usado por Client
 * Components. A lógica de leitura/escrita fica em `@/lib/services/setting`.
 *
 * Fase 16.2: organizados em seções (renderizadas como abas). Adicionar um campo aqui já o faz
 * aparecer no formulário e ser salvo (a action percorre SETTING_FIELDS).
 */
export type SettingFieldType = "text" | "textarea" | "number" | "time" | "email";

export type SettingSection = {
  id: "pousada" | "operacao" | "financeiro" | "notificacoes" | "integracoes";
  label: string;
  description?: string;
  /** Oculta a aba na UI (mas mantém os campos MAPEADOS para as próximas fases). Os valores
   *  já salvos são preservados no submit (a action só grava chaves presentes no formulário). */
  hidden?: boolean;
};

export const SETTING_SECTIONS: readonly SettingSection[] = [
  { id: "pousada", label: "Dados da pousada", description: "Identificação e contatos exibidos aos hóspedes." },
  { id: "operacao", label: "Operação", description: "Horários e regras da estadia." },
  { id: "financeiro", label: "Financeiro & Reservas", description: "Prazos, hold e taxas." },
  // Ocultas por ora (a finalizar nas próximas fases). Mantidas mapeadas: basta remover `hidden`.
  {
    id: "notificacoes",
    label: "Notificações WhatsApp",
    description:
      "Aviso automático ao admin a cada nova reserva (Z-API). Deixe em branco para desativar.",
    hidden: true,
  },
  {
    id: "integracoes",
    label: "Integrações",
    description: "Sincronização de calendários (em breve).",
    hidden: true,
  },
] as const;

export type SettingFieldMask = "phone" | "phone-intl" | "cnpj" | "cep";

export type SettingField = {
  key: string;
  label: string;
  type: SettingFieldType;
  section: SettingSection["id"];
  placeholder?: string;
  help?: string;
  /** Máscara de exibição (ver `@/lib/masks`). Não altera a validação. */
  mask?: SettingFieldMask;
  /** Campo obrigatório (validado no servidor). */
  required?: boolean;
};

export const SETTING_FIELDS: readonly SettingField[] = [
  // Dados da pousada
  { key: "pousada_name", label: "Nome da pousada", type: "text", section: "pousada", placeholder: "Casa da Nete" },
  { key: "cnpj", label: "CNPJ", type: "text", section: "pousada", placeholder: "00.000.000/0001-00", mask: "cnpj" },
  { key: "address", label: "Endereço", type: "textarea", section: "pousada", placeholder: "Rua, nº, bairro, cidade/UF, CEP" },
  {
    key: "contact_whatsapp",
    label: "WhatsApp de contato",
    type: "text",
    section: "pousada",
    placeholder: "+55 21 98233-1649",
    mask: "phone-intl",
    required: true,
    help: "Número usado nos botões \"Falar no WhatsApp\" das telas de reserva. Obrigatório.",
  },
  { key: "contact_email", label: "E-mail de contato", type: "email", section: "pousada", placeholder: "contato@casadanete.com.br" },
  { key: "instagram", label: "Instagram", type: "text", section: "pousada", placeholder: "@casadanete" },
  { key: "facebook", label: "Facebook", type: "text", section: "pousada" },

  // Operação
  { key: "checkin_time", label: "Horário de check-in", type: "time", section: "operacao", placeholder: "14:00" },
  { key: "checkout_time", label: "Horário de check-out", type: "time", section: "operacao", placeholder: "11:00" },
  { key: "min_nights_default", label: "Estadia mínima padrão (noites)", type: "number", section: "operacao", help: "Referência; a estadia mínima real é por acomodação." },
  { key: "rules_pets", label: "Política de pets", type: "text", section: "operacao", placeholder: "Aceitamos pets de pequeno porte" },
  { key: "rules_parties", label: "Política de festas/eventos", type: "text", section: "operacao", placeholder: "Não são permitidas festas" },
  { key: "house_rules", label: "Regras da casa", type: "textarea", section: "operacao" },

  // Financeiro & Reservas
  { key: "hold_hours", label: "Expiração do hold (horas)", type: "number", section: "financeiro", help: "Tempo que uma reserva pendente segura as datas.", placeholder: "24" },
  { key: "payment_deadline", label: "Prazo de pagamento", type: "text", section: "financeiro", placeholder: "Em até 48h após a confirmação" },
  { key: "extra_fees", label: "Taxas extras", type: "textarea", section: "financeiro", placeholder: "Taxa de limpeza, hóspede extra…" },
  { key: "cancellation_policy", label: "Política de cancelamento", type: "textarea", section: "financeiro" },

  // Notificações WhatsApp (Z-API). Secrets também podem vir de env (ZAPI_*), que têm precedência.
  { key: "zapi_instance_id", label: "Instância Z-API", type: "text", section: "notificacoes", placeholder: "3ABC…", help: "ID da instância no painel da Z-API." },
  { key: "zapi_token", label: "Token Z-API", type: "text", section: "notificacoes", help: "Segredo da instância. Em produção, prefira a variável de ambiente ZAPI_TOKEN." },
  { key: "zapi_client_token", label: "Client-Token (Account Security)", type: "text", section: "notificacoes", help: "Só se a conta Z-API estiver com \"Account Security\" ligado. É o \"Token de segurança da conta\" (menu Segurança). Em produção, prefira a variável de ambiente ZAPI_CLIENT_TOKEN." },
  { key: "whatsapp_notify_phone", label: "Telefone destino", type: "text", section: "notificacoes", placeholder: "+55 24 99999-9999", mask: "phone-intl", help: "Número que recebe o aviso de nova reserva (com DDI). Se em branco, usa o \"WhatsApp de contato\" da aba Dados da pousada." },
] as const;

export type SettingKey = (typeof SETTING_FIELDS)[number]["key"];
