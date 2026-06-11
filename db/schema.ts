import {
  pgTable,
  text,
  numeric,
  date,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'expense' | 'income'
  icon: text("icon"),
  color: text("color"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'expense' | 'income'
  amount: numeric("amount").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  date: date("date").notNull(),
  note: text("note"),
  isRecurring: boolean("is_recurring").default(false),
  recurrence: text("recurrence"), // 'weekly' | 'monthly' | 'yearly' | null
  recurrenceEnd: date("recurrence_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const debts = pgTable("debts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  creditor: text("creditor"),
  type: text("type").notNull(), // 'debt' | 'pursuit'
  totalAmount: numeric("total_amount").notNull(),
  paidAmount: numeric("paid_amount").notNull().default("0"),
  monthlyPayment: numeric("monthly_payment").notNull(),
  startDate: date("start_date").notNull(),
  status: text("status").notNull(), // 'active' | 'paid' | 'paused'
  pursuitNumber: text("pursuit_number"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const debtPayments = pgTable("debt_payments", {
  id: text("id").primaryKey(),
  debtId: text("debt_id")
    .notNull()
    .references(() => debts.id),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investmentCategories = pgTable("investment_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const investments = pgTable("investments", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => investmentCategories.id),
  assetName: text("asset_name").notNull(),
  amountInvested: numeric("amount_invested").notNull(),
  currentValue: numeric("current_value"),
  investmentDate: date("investment_date").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const savingsProjects = pgTable("savings_projects", {
  id: text("id").primaryKey(),
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
  projectId: text("project_id")
    .notNull()
    .references(() => savingsProjects.id),
  amount: numeric("amount").notNull(),
  date: date("date").notNull(),
  note: text("note"),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const profile = pgTable("profile", {
  id: text("id").primaryKey().default("default"),
  initialBalance: numeric("initial_balance").notNull().default("0"),
  monthlySalary: numeric("monthly_salary").notNull().default("0"),
  onboardingDone: boolean("onboarding_done").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type DebtPayment = typeof debtPayments.$inferSelect;
export type InvestmentCategory = typeof investmentCategories.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type SavingsProject = typeof savingsProjects.$inferSelect;
export type SavingsContribution = typeof savingsContributions.$inferSelect;
export type Profile = typeof profile.$inferSelect;
