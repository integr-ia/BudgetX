import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  addDays,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { db } from "@/lib/db";
import {
  profiles,
  transactions,
  categories,
  debts,
  debtPayments,
  investments,
  investmentCategories,
  savingsProjects,
  savingsContributions,
} from "@/db/schema";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export async function getProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function getCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.name));
}

export async function getTransactions(userId: string) {
  return db
    .select({
      transaction: transactions,
      category: categories,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.date), desc(transactions.createdAt));
}

export async function getDebts(userId: string) {
  return db
    .select()
    .from(debts)
    .where(eq(debts.userId, userId))
    .orderBy(desc(debts.createdAt));
}

export async function getDebtPayments(userId: string, debtId: string) {
  return db
    .select()
    .from(debtPayments)
    .where(and(eq(debtPayments.userId, userId), eq(debtPayments.debtId, debtId)))
    .orderBy(desc(debtPayments.date));
}

export async function getInvestments(userId: string) {
  return db
    .select({
      investment: investments,
      category: investmentCategories,
    })
    .from(investments)
    .innerJoin(
      investmentCategories,
      eq(investments.categoryId, investmentCategories.id)
    )
    .where(eq(investments.userId, userId))
    .orderBy(desc(investments.investmentDate));
}

export async function getInvestmentCategories(userId: string) {
  return db
    .select()
    .from(investmentCategories)
    .where(eq(investmentCategories.userId, userId))
    .orderBy(asc(investmentCategories.name));
}

export async function getSavingsProjects(userId: string) {
  return db
    .select()
    .from(savingsProjects)
    .where(eq(savingsProjects.userId, userId))
    .orderBy(desc(savingsProjects.createdAt));
}

/* ---------- Agrégats Dashboard / Analyses ---------- */

const num = (v: string | null) => (v ? parseFloat(v) : 0);

/** Somme des transactions réalisées (date <= aujourd'hui) sur une période, par type. */
async function sumTransactions(
  userId: string,
  type: "expense" | "income",
  from: string,
  to: string
) {
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, type),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    );
  return num(row?.total ?? "0");
}

async function sumDebtPayments(userId: string, from: string, to: string) {
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${debtPayments.amount}), 0)` })
    .from(debtPayments)
    .where(
      and(
        eq(debtPayments.userId, userId),
        gte(debtPayments.date, from),
        lte(debtPayments.date, to)
      )
    );
  return num(row?.total ?? "0");
}

async function sumSavingsContributions(
  userId: string,
  from: string,
  to: string
) {
  const [row] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${savingsContributions.amount}), 0)`,
    })
    .from(savingsContributions)
    .where(
      and(
        eq(savingsContributions.userId, userId),
        gte(savingsContributions.date, from),
        lte(savingsContributions.date, to)
      )
    );
  return num(row?.total ?? "0");
}

export interface MonthSummary {
  income: number;
  expenses: number;
  debtRepayments: number;
  netBalance: number; // règle n°2
  savingsContributed: number;
  savingsRate: number; // règle n°6
}

/** Bilan du mois courant — transactions futures exclues (règle n°3). */
export async function getMonthSummary(userId: string): Promise<MonthSummary> {
  const now = new Date();
  const from = iso(startOfMonth(now));
  const today = iso(now); // exclut les transactions futures du réalisé

  const [income, expenses, debtRepayments, savingsContributed] =
    await Promise.all([
      sumTransactions(userId, "income", from, today),
      sumTransactions(userId, "expense", from, today),
      sumDebtPayments(userId, from, today),
      sumSavingsContributions(userId, from, today),
    ]);

  return {
    income,
    expenses,
    debtRepayments,
    netBalance: income - expenses - debtRepayments,
    savingsContributed,
    savingsRate: income > 0 ? (savingsContributed / income) * 100 : 0,
  };
}

/** Solde réel (règle n°1) = initial_balance + Σ revenus − Σ dépenses − Σ remboursements. */
export async function getRealBalance(userId: string): Promise<number> {
  const profile = await getProfile(userId);
  const today = iso(new Date());
  const [income, expenses, repayments] = await Promise.all([
    sumTransactions(userId, "income", "1970-01-01", today),
    sumTransactions(userId, "expense", "1970-01-01", today),
    sumDebtPayments(userId, "1970-01-01", today),
  ]);
  return num(profile?.initialBalance ?? "0") + income - expenses - repayments;
}

export async function getActiveDebtTotals(userId: string) {
  const rows = await db
    .select()
    .from(debts)
    .where(and(eq(debts.userId, userId), eq(debts.status, "active")));
  let totalRemaining = 0;
  let pursuitsRemaining = 0;
  for (const d of rows) {
    const remaining = num(d.totalAmount) - num(d.paidAmount);
    totalRemaining += remaining;
    if (d.type === "pursuit") pursuitsRemaining += remaining;
  }
  return { totalRemaining, pursuitsRemaining, count: rows.length };
}

/** Transactions planifiées dans les 7 prochains jours + mensualités de dettes actives. */
export async function getUpcoming(userId: string) {
  const today = new Date();
  const from = iso(addDays(today, 1));
  const to = iso(addDays(today, 7));

  const upcomingTx = await db
    .select({ transaction: transactions, category: categories })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    )
    .orderBy(asc(transactions.date));

  const activeDebtsWithPayment = await db
    .select()
    .from(debts)
    .where(
      and(
        eq(debts.userId, userId),
        eq(debts.status, "active"),
        sql`${debts.monthlyPayment} IS NOT NULL`
      )
    );

  return { upcomingTx, activeDebtsWithPayment };
}

/** Dépenses du mois courant par catégorie (donut). */
export async function getExpensesByCategory(userId: string) {
  const now = new Date();
  const from = iso(startOfMonth(now));
  const to = iso(now);
  return db
    .select({
      name: categories.name,
      color: categories.color,
      total: sql<string>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    )
    .groupBy(categories.id, categories.name, categories.color)
    .orderBy(desc(sql`SUM(${transactions.amount})`));
}

export interface MonthlyPoint {
  month: string; // "yyyy-MM"
  label: string;
  income: number;
  expenses: number;
  debtRepayments: number;
  net: number;
}

/** Historique mensuel (revenus, dépenses, remboursements, net) sur N mois. */
export async function getMonthlyHistory(
  userId: string,
  months: number
): Promise<MonthlyPoint[]> {
  const now = new Date();
  const points: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    const from = iso(startOfMonth(d));
    const to = i === 0 ? iso(now) : iso(endOfMonth(d));
    const [income, expenses, debtRepayments] = await Promise.all([
      sumTransactions(userId, "income", from, to),
      sumTransactions(userId, "expense", from, to),
      sumDebtPayments(userId, from, to),
    ]);
    points.push({
      month: format(d, "yyyy-MM"),
      label: format(d, "MMM yy"),
      income,
      expenses,
      debtRepayments,
      net: income - expenses - debtRepayments,
    });
  }
  return points;
}
