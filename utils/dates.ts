import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "dd.MM.yyyy");
}

export function formatMonth(d: string | Date): string {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "MMM yyyy", { locale: fr });
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}
