import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVESTMENT_CATEGORIES,
} from "@/constants/categories";

export type Db = PgliteDatabase<typeof schema>;

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id),
  date DATE NOT NULL,
  note TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence TEXT,
  recurrence_end DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  creditor TEXT,
  type TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  monthly_payment NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL,
  pursuit_number TEXT,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS debt_payments (
  id TEXT PRIMARY KEY,
  debt_id TEXT NOT NULL REFERENCES debts(id),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS investment_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES investment_categories(id),
  asset_name TEXT NOT NULL,
  amount_invested NUMERIC NOT NULL,
  current_value NUMERIC,
  investment_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS savings_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal_amount NUMERIC NOT NULL,
  saved_amount NUMERIC NOT NULL DEFAULT 0,
  target_date DATE,
  color TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS savings_contributions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES savings_projects(id),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY DEFAULT 'default',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  monthly_salary NUMERIC NOT NULL DEFAULT 0,
  onboarding_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

let dbPromise: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PGlite est uniquement disponible côté client"));
  }
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

async function initDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = await PGlite.create("idb://budgetx");
  await pg.exec(INIT_SQL);
  const db = drizzle(pg, { schema });
  await seed(db);
  return db;
}

async function seed(db: Db) {
  const existing = await db.select().from(schema.categories);
  if (existing.length === 0) {
    await db.insert(schema.categories).values([
      ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "expense", isDefault: true })),
      ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "income", isDefault: true })),
    ]);
  }
  const existingInv = await db.select().from(schema.investmentCategories);
  if (existingInv.length === 0) {
    await db
      .insert(schema.investmentCategories)
      .values(DEFAULT_INVESTMENT_CATEGORIES.map((c) => ({ ...c, isDefault: true })));
  }
  const existingProfile = await db.select().from(schema.profile);
  if (existingProfile.length === 0) {
    await db.insert(schema.profile).values({ id: "default" });
  }
}

export function uid(): string {
  return crypto.randomUUID();
}
