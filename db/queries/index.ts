import { and, asc, desc, eq, gte, isNotNull, lte, notInArray, sql } from "drizzle-orm";
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
  investmentWithdrawals,
  savingsProjects,
  savingsContributions,
} from "@/db/schema";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * Instant de mise en prod de la déduction auto des épargnes/investissements
 * (commit d613a14). `initialBalance` intégrait déjà tout l'historique
 * antérieur : seuls les enregistrements créés après ce rollout doivent être
 * déduits du solde, sous peine de double comptage.
 */
const BALANCE_TRACKING_ROLLOUT_AT = new Date("2026-06-25T07:44:08+02:00");

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

export async function getInvestmentWithdrawals(userId: string) {
  return db
    .select()
    .from(investmentWithdrawals)
    .where(eq(investmentWithdrawals.userId, userId))
    .orderBy(desc(investmentWithdrawals.date), desc(investmentWithdrawals.createdAt));
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

/**
 * Identifiants des transactions "miroir" déjà comptabilisées via une autre
 * table (remboursement de dette, versement d'épargne, investissement…), à
 * exclure des sommes de `transactions` pour éviter un double comptage.
 */
async function getLinkedTransactionIds(userId: string): Promise<string[]> {
  const [fromDebt, fromSavings, fromInvest, fromWithdrawals] =
    await Promise.all([
      db
        .select({ id: debtPayments.transactionId })
        .from(debtPayments)
        .where(
          and(eq(debtPayments.userId, userId), isNotNull(debtPayments.transactionId))
        ),
      db
        .select({ id: savingsContributions.transactionId })
        .from(savingsContributions)
        .where(
          and(
            eq(savingsContributions.userId, userId),
            isNotNull(savingsContributions.transactionId)
          )
        ),
      db
        .select({ id: investments.transactionId })
        .from(investments)
        .where(
          and(eq(investments.userId, userId), isNotNull(investments.transactionId))
        ),
      db
        .select({ id: investmentWithdrawals.transactionId })
        .from(investmentWithdrawals)
        .where(
          and(
            eq(investmentWithdrawals.userId, userId),
            isNotNull(investmentWithdrawals.transactionId)
          )
        ),
    ]);
  return [...fromDebt, ...fromSavings, ...fromInvest, ...fromWithdrawals]
    .map((r) => r.id)
    .filter((id): id is string => !!id);
}

/** Somme des transactions réalisées (date <= aujourd'hui) sur une période, par type. */
async function sumTransactions(
  userId: string,
  type: "expense" | "income",
  from: string,
  to: string,
  excludeIds: string[] = []
) {
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, type),
        gte(transactions.date, from),
        lte(transactions.date, to),
        excludeIds.length ? notInArray(transactions.id, excludeIds) : undefined
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
        lte(savingsContributions.date, to),
        gte(savingsContributions.createdAt, BALANCE_TRACKING_ROLLOUT_AT)
      )
    );
  return num(row?.total ?? "0");
}

async function sumInvested(userId: string, from: string, to: string) {
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${investments.amountInvested}), 0)` })
    .from(investments)
    .where(
      and(
        eq(investments.userId, userId),
        gte(investments.investmentDate, from),
        lte(investments.investmentDate, to),
        gte(investments.createdAt, BALANCE_TRACKING_ROLLOUT_AT)
      )
    );
  return num(row?.total ?? "0");
}

async function sumInvestmentWithdrawals(userId: string, from: string, to: string) {
  const [row] = await db
    .select({ total: sql<string>`COALESCE(SUM(${investmentWithdrawals.amount}), 0)` })
    .from(investmentWithdrawals)
    .where(
      and(
        eq(investmentWithdrawals.userId, userId),
        gte(investmentWithdrawals.date, from),
        lte(investmentWithdrawals.date, to),
        gte(investmentWithdrawals.createdAt, BALANCE_TRACKING_ROLLOUT_AT)
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
  const excludeIds = await getLinkedTransactionIds(userId);

  const [
    income,
    expenses,
    debtRepayments,
    savingsContributed,
    invested,
    withdrawn,
  ] = await Promise.all([
    sumTransactions(userId, "income", from, today, excludeIds),
    sumTransactions(userId, "expense", from, today, excludeIds),
    sumDebtPayments(userId, from, today),
    sumSavingsContributions(userId, from, today),
    sumInvested(userId, from, today),
    sumInvestmentWithdrawals(userId, from, today),
  ]);

  return {
    income,
    expenses,
    debtRepayments,
    netBalance:
      income - expenses - debtRepayments - savingsContributed - (invested - withdrawn),
    savingsContributed,
    savingsRate: income > 0 ? (savingsContributed / income) * 100 : 0,
  };
}

/**
 * Solde réel (règle n°1) = initial_balance + Σ revenus − Σ dépenses
 * − Σ remboursements de dette − Σ versements d'épargne
 * − (Σ montants investis − Σ retraits d'investissement).
 */
export async function getRealBalance(userId: string): Promise<number> {
  const profile = await getProfile(userId);
  const today = iso(new Date());
  const excludeIds = await getLinkedTransactionIds(userId);
  const [income, expenses, repayments, savingsContributed, invested, withdrawn] =
    await Promise.all([
      sumTransactions(userId, "income", "1970-01-01", today, excludeIds),
      sumTransactions(userId, "expense", "1970-01-01", today, excludeIds),
      sumDebtPayments(userId, "1970-01-01", today),
      sumSavingsContributions(userId, "1970-01-01", today),
      sumInvested(userId, "1970-01-01", today),
      sumInvestmentWithdrawals(userId, "1970-01-01", today),
    ]);
  return (
    num(profile?.initialBalance ?? "0") +
    income -
    expenses -
    repayments -
    savingsContributed -
    (invested - withdrawn)
  );
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
