import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { todayISO } from "./dates";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportJSON() {
  const db = await getDb();
  const data = {
    exportedAt: new Date().toISOString(),
    profile: await db.select().from(schema.profile),
    categories: await db.select().from(schema.categories),
    transactions: await db.select().from(schema.transactions),
    debts: await db.select().from(schema.debts),
    debtPayments: await db.select().from(schema.debtPayments),
    investmentCategories: await db.select().from(schema.investmentCategories),
    investments: await db.select().from(schema.investments),
    savingsProjects: await db.select().from(schema.savingsProjects),
    savingsContributions: await db.select().from(schema.savingsContributions),
  };
  download(`budgetx-export-${todayISO()}.json`, JSON.stringify(data, null, 2), "application/json");
}

export async function exportCSV() {
  const db = await getDb();
  const txs = await db.select().from(schema.transactions);
  const cats = await db.select().from(schema.categories);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const rows = [
    ["date", "type", "montant_chf", "categorie", "note", "recurrence"],
    ...txs.map((t) => [
      t.date,
      t.type === "expense" ? "dépense" : "revenu",
      t.amount,
      catName.get(t.categoryId) ?? "",
      t.note ?? "",
      t.recurrence ?? "",
    ]),
  ];
  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  download(`budgetx-transactions-${todayISO()}.csv`, "﻿" + csv, "text/csv;charset=utf-8");
}
