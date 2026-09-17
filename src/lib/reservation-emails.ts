import { sendEmail } from "@/lib/email";
import type { Guest, Reservation } from "@/lib/services/reservation";
import { formatCentsBRL } from "@/lib/utils";

/**
 * E-mails transacionais da reserva (Fase 5): confirmação de solicitação ao hóspede + aviso ao
 * admin. Falha de e-mail NÃO deve derrubar a reserva — o chamador captura e apenas registra.
 */
function siteBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ?? "http://localhost:3000"
  );
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export async function sendReservationRequestedEmails(args: {
  reservation: Reservation;
  guest: Guest;
  accommodationName: string;
}): Promise<void> {
  const { reservation: r, guest, accommodationName } = args;
  const total = formatCentsBRL(r.totalPriceCents);
  const link = `${siteBaseUrl()}/reserva/${r.publicCode}`;
  const period = `${r.checkIn} → ${r.checkOut} (${r.nights} noite${r.nights > 1 ? "s" : ""})`;

  // 1) Hóspede
  const guestSubject = `Recebemos sua solicitação de reserva — ${r.publicCode}`;
  const guestText = [
    `Olá, ${firstName(guest.fullName)}!`,
    ``,
    `Recebemos sua solicitação de reserva na Casa Carram. Ela está PENDENTE de confirmação.`,
    ``,
    `Código: ${r.publicCode}`,
    `Acomodação: ${accommodationName}`,
    `Período: ${period}`,
    `Hóspedes: ${r.guestsCount}`,
    `Total: ${total}`,
    ``,
    `Para confirmar, entraremos em contato com as instruções de pagamento. A reserva fica`,
    `reservada por até 24h. Acompanhe pelo link: ${link}`,
  ].join("\n");
  const guestHtml = `
    <p>Olá, ${firstName(guest.fullName)}!</p>
    <p>Recebemos sua solicitação de reserva na <strong>Casa Carram</strong>. Ela está <strong>pendente</strong> de confirmação.</p>
    <ul>
      <li><strong>Código:</strong> ${r.publicCode}</li>
      <li><strong>Acomodação:</strong> ${accommodationName}</li>
      <li><strong>Período:</strong> ${period}</li>
      <li><strong>Hóspedes:</strong> ${r.guestsCount}</li>
      <li><strong>Total:</strong> ${total}</li>
    </ul>
    <p>Entraremos em contato com as instruções de pagamento. A reserva fica reservada por até 24h.</p>
    <p><a href="${link}">Acompanhar minha reserva</a></p>`;

  await sendEmail({
    to: guest.email,
    subject: guestSubject,
    text: guestText,
    html: guestHtml,
  });

  // 2) Admin (se configurado)
  const adminTo = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminTo) {
    console.info(
      `[email:dev] ADMIN_NOTIFICATION_EMAIL ausente — aviso de nova reserva ${r.publicCode} não enviado.`,
    );
    return;
  }
  await sendEmail({
    to: adminTo,
    subject: `Nova solicitação de reserva — ${r.publicCode}`,
    text: [
      `Nova solicitação de reserva (${r.status}).`,
      ``,
      `Código: ${r.publicCode}`,
      `Acomodação: ${accommodationName}`,
      `Período: ${period}`,
      `Hóspedes: ${r.guestsCount}`,
      `Total: ${total}`,
      ``,
      `Hóspede: ${guest.fullName} — ${guest.email} — ${guest.phone}`,
    ].join("\n"),
    html: `
      <p>Nova solicitação de reserva (<strong>${r.status}</strong>).</p>
      <ul>
        <li><strong>Código:</strong> ${r.publicCode}</li>
        <li><strong>Acomodação:</strong> ${accommodationName}</li>
        <li><strong>Período:</strong> ${period}</li>
        <li><strong>Hóspedes:</strong> ${r.guestsCount}</li>
        <li><strong>Total:</strong> ${total}</li>
        <li><strong>Hóspede:</strong> ${guest.fullName} — ${guest.email} — ${guest.phone}</li>
      </ul>`,
  });
}
