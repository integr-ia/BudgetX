import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/** Format dd.MM.yyyy (FR-CH) */
export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "dd.MM.yyyy");
}

export function formatMonth(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "MMMM yyyy", { locale: fr });
}

export function formatMonthShort(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "MMM", { locale: fr });
}

/** Date du jour au format ISO yyyy-MM-dd */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
