import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { Db } from "@/db/client";
import * as schema from "@/db/schema";
import { toNumber } from "@/utils/currency";
import { toISODate, todayISO } from "@/utils/dates";

export interface MonthlyStats {
  income: number;
  expenses: number;
  debtPayments: number;
  savingsContributed: number;
  net: number; // revenus − dépenses − remboursements
  savingsRate: number; // %
}

/** Bilan "réalisé" : seules les écritures avec date <= aujourd'hui comptent. */
export async function getMonthlyStats(db: Db, month: Date): Promise<MonthlyStats> {
  const from = toISODate(startOfMonth(month));
  const to = toISODate(endOfMonth(month));
  const today = todayISO();
  const cap = to < today ? to : today;

  const txs = await db.select().from(schema.transactions);
  const inMonth = txs.filter((t) => t.date >= from && t.date <= cap);
  const income = inMonth
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + toNumber(t.amount), 0);
  const expenses = inMonth
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + toNumber(t.amount), 0);

  const payments = await db.select().from(schema.debtPayments);
  const debtPaid = payments
    .filter((p) => p.date >= from && p.date <= cap)
    .reduce((s, p) => s + toNumber(p.amount), 0);

  const contribs = await db.select().from(schema.savingsContributions);
  const saved = contribs
    .filter((c) => c.date >= from && c.date <= cap)
    .reduce((s, c) => s + toNumber(c.amount), 0);

  return {
    income,
    expenses,
    debtPayments: debtPaid,
    savingsContributed: saved,
    net: income - expenses - debtPaid,
    savingsRate: income > 0 ? (saved / income) * 100 : 0,
  };
}

/** Solde réel = solde initial + revenus − dépenses − remboursements (réalisés). */
export async function getRealBalance(db: Db): Promise<number> {
  const today = todayISO();
  const [prof] = await db.select().from(schema.profile);
  const initial = toNumber(prof?.initialBalance);

  const txs = await db.select().from(schema.transactions);
  const realized = txs.filter((t) => t.date <= today);
  const income = realized
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + toNumber(t.amount), 0);
  const expenses = realized
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + toNumber(t.amount), 0);

  const payments = await db.select().from(schema.debtPayments);
  const debtPaid = payments
    .filter((p) => p.date <= today)
    .reduce((s, p) => s + toNumber(p.amount), 0);

  return initial + income - expenses - debtPaid;
}

/** Historique mensuel (revenus, dépenses, net) sur N mois, du plus ancien au plus récent. */
export async function getMonthlyHistory(db: Db, months: number) {
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const month = subMonths(new Date(), i);
    const stats = await getMonthlyStats(db, month);
    result.push({ month, ...stats });
  }
  return result;
}

/** Mensualités restantes d'une dette : CEIL((total − payé) / mensualité). */
export function remainingInstallments(debt: schema.Debt): number {
  const remaining = toNumber(debt.totalAmount) - toNumber(debt.paidAmount);
  const monthly = toNumber(debt.monthlyPayment);
  if (remaining <= 0 || monthly <= 0) return 0;
  return Math.ceil(remaining / monthly);
}

/** Date de fin estimée = aujourd'hui + mensualités restantes (en mois). */
export function estimatedEndDate(debt: schema.Debt): Date | null {
  const n = remainingInstallments(debt);
  if (n === 0) return null;
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}
