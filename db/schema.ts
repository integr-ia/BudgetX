import {
  pgTable,
  text,
  numeric,
  boolean,
  date,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  initialBalance: numeric("initial_balance").notNull().default("0"),
  monthlySalary: numeric("monthly_salary").notNull().default("0"),
  // Jour du mois (1-31) de réception du salaire, utilisé pour le solde projeté.
  salaryDay: integer("salary_day"),
  onboardingDone: boolean("onboarding_done").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'expense' | 'income'
  icon: text("icon"),
  color: text("color"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'expense' | 'income'
  amount: numeric("amount").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  date: date("date").notNull(),
  note: text("note"),
  isRecurring: boolean("is_recurring").default(false),
  recurrence: text("recurrence"), // 'weekly' | 'monthly' | 'yearly' | NULL
  recurrenceEnd: date("recurrence_end"),
  // Regroupe toutes les occurrences générées d'un même abonnement récurrent
  // (vaut l'id de la transaction d'origine de la série, NULL si non récurrente).
  seriesId: text("series_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const debts = pgTable("debts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  creditor: text("creditor"),
  type: text("type").notNull(), // 'debt' | 'pursuit'
  totalAmount: numeric("total_amount").notNull(),
  paidAmount: numeric("paid_amount").notNull().default("0"),
  monthlyPayment: numeric("monthly_payment"),
  startDate: date("start_date").notNull(),
  status: text("status").notNull(), // 'active' | 'paid' | 'paused'
  pursuitNumber: text("pursuit_number"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const debtPayments = pgTable("debt_payments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  debtId: text("debt_id")
    .notNull()
    .references(() => debts.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investmentCategories = pgTable("investment_categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investments = pgTable("investments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => investmentCategories.id),
  assetName: text("asset_name").notNull(),
  amountInvested: numeric("amount_invested").notNull(),
  currentValue: numeric("current_value"),
  investmentDate: date("investment_date").notNull(),
  note: text("note"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const investmentWithdrawals = pgTable("investment_withdrawals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  investmentId: text("investment_id")
    .notNull()
    .references(() => investments.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savingsProjects = pgTable("savings_projects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goalAmount: numeric("goal_amount").notNull(),
  savedAmount: numeric("saved_amount").notNull().default("0"),
  targetDate: date("target_date"),
  color: text("color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const savingsContributions = pgTable("savings_contributions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => savingsProjects.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type DebtPayment = typeof debtPayments.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type InvestmentCategory = typeof investmentCategories.$inferSelect;
export type InvestmentWithdrawal = typeof investmentWithdrawals.$inferSelect;
export type SavingsProject = typeof savingsProjects.$inferSelect;
export type SavingsContribution = typeof savingsContributions.$inferSelect;
