/**
 * Utilitários de data para estadias (datas puras `YYYY-MM-DD`, sem hora — evita bugs de fuso).
 * Convenção de intervalo: **`[check_in, check_out)`** (a diária do check-out não é cobrada).
 * Regras de negócio referem-se ao fuso `America/Sao_Paulo`.
 */
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Valida uma data ISO `YYYY-MM-DD` real (rejeita 2026-02-30 etc.). */
export function isISODate(value: string): boolean {
  if (!ISO_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function toUTC(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): string {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Nº de noites de `[checkIn, checkOut)` = diferença em dias. Pode ser 0/negativo se inválido. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((toUTC(checkOut) - toUTC(checkIn)) / 86_400_000);
}

/** Lista das datas de diária em `[checkIn, checkOut)` (exclui o dia de check-out). */
export function eachNight(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const end = toUTC(checkOut);
  for (let ms = toUTC(checkIn); ms < end; ms += 86_400_000) {
    nights.push(fromUTC(ms));
  }
  return nights;
}

/** Soma `days` dias a uma data ISO. */
export function addDays(value: string, days: number): string {
  return fromUTC(toUTC(value) + days * 86_400_000);
}

/** Data de "hoje" em `America/Sao_Paulo` (`YYYY-MM-DD`). */
export function todayInSaoPaulo(): string {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

/** `true` se a data está estritamente no passado em relação a hoje (São Paulo). */
export function isPastDate(value: string): boolean {
  return value < todayInSaoPaulo();
}

/** Exibe uma data ISO `YYYY-MM-DD` como `DD-MM-YYYY` (mais legível ao usuário BR). Se o valor
 *  não for ISO, retorna-o inalterado (nunca quebra a renderização). */
export function formatDateBR(iso: string): string {
  if (!ISO_RE.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/** Período de estadia formatado: `DD-MM-YYYY - DD-MM-YYYY (N noites)`. */
export function formatStayBR(checkIn: string, checkOut: string, nights?: number): string {
  const n = nights ?? nightsBetween(checkIn, checkOut);
  return `${formatDateBR(checkIn)} - ${formatDateBR(checkOut)} (${n} noite${n === 1 ? "" : "s"})`;
}
