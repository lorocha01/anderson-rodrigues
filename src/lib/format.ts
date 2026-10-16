const TZ = "America/Sao_Paulo";

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dateLong(iso: string) {
  const text = new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: TZ, weekday: "long", day: "2-digit", month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Rótulos curtos para o seletor de dias: { weekday: "Seg", day: "19/10" }. */
export function dayChip(iso: string) {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "short" }).replace(".", "");
  const day = d.toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), day };
}

export function dateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
}

export function time(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function dateTime(iso: string) {
  return `${dateShort(iso)} às ${time(iso)}`;
}

/** Chave yyyy-mm-dd no fuso de Brasília (para agrupar horários por dia). */
export function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "";
}

export function sessionsLabel(n: number | null) {
  if (n === null) return "Atendimentos livres";
  return n === 1 ? "1 atendimento" : `${n} atendimentos`;
}

export const RISK_LABEL = ["Sem risco", "Atenção", "Risco imediato"] as const;
