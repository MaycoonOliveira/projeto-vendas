import { Resend } from "resend";

/**
 * Envio de e-mail transacional (Resend).
 *
 * Sem `RESEND_API_KEY`, faz fallback para log no servidor (dev) — o fluxo não quebra antes de
 * o domínio remetente estar verificado. Nunca loga conteúdo sensível além de destinatário/assunto
 * em produção; o corpo só é logado no fallback de dev.
 */
type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  const resend = getResend();
  const from = process.env.EMAIL_FROM ?? "Casa Carram <onboarding@resend.dev>";

  if (!resend) {
    console.info(
      `[email:dev] (RESEND_API_KEY ausente) Para: ${to} | Assunto: ${subject}\n${text}`,
    );
    return;
  }

  const { error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) {
    console.error("[email] Falha no envio:", error.message ?? error);
    throw new Error("Falha ao enviar e-mail.");
  }
}
