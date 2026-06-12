"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { debts, debtPayments } from "@/db/schema";
import { requireUserId } from "./helpers";

function revalidateAll() {
  revalidatePath("/debts");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function createDebt(formData: FormData) {
  const userId = await requireUserId();
  await db.insert(debts).values({
    id: crypto.randomUUID(),
    userId,
    name: String(formData.get("name")),
    creditor: String(formData.get("creditor") ?? "") || null,
    type: String(formData.get("type") ?? "debt"),
    totalAmount: String(formData.get("totalAmount")),
    paidAmount: String(formData.get("paidAmount") ?? "0") || "0",
    monthlyPayment: String(formData.get("monthlyPayment") ?? "") || null,
    startDate: String(formData.get("startDate")),
    status: String(formData.get("status") ?? "active"),
    pursuitNumber: String(formData.get("pursuitNumber") ?? "") || null,
    note: String(formData.get("note") ?? "") || null,
  });
  revalidateAll();
}

export async function updateDebt(id: string, formData: FormData) {
  const userId = await requireUserId();
  await db
    .update(debts)
    .set({
      name: String(formData.get("name")),
      creditor: String(formData.get("creditor") ?? "") || null,
      type: String(formData.get("type") ?? "debt"),
      totalAmount: String(formData.get("totalAmount")),
      paidAmount: String(formData.get("paidAmount") ?? "0") || "0",
      monthlyPayment: String(formData.get("monthlyPayment") ?? "") || null,
      startDate: String(formData.get("startDate")),
      status: String(formData.get("status") ?? "active"),
      pursuitNumber: String(formData.get("pursuitNumber") ?? "") || null,
      note: String(formData.get("note") ?? "") || null,
      updatedAt: new Date(),
    })
    .where(and(eq(debts.id, id), eq(debts.userId, userId)));
  revalidateAll();
}

export async function deleteDebt(id: string) {
  const userId = await requireUserId();
  await db
    .delete(debts)
    .where(and(eq(debts.id, id), eq(debts.userId, userId)));
  revalidateAll();
}

/** Enregistre un remboursement et incrémente paid_amount ; solde la dette si atteinte. */
export async function addDebtPayment(formData: FormData) {
  const userId = await requireUserId();
  const debtId = String(formData.get("debtId"));
  const amount = String(formData.get("amount"));

  const [debt] = await db
    .select()
    .from(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .limit(1);
  if (!debt) throw new Error("Dette introuvable");

  await db.insert(debtPayments).values({
    id: crypto.randomUUID(),
    userId,
    debtId,
    amount,
    date: String(formData.get("date")),
    note: String(formData.get("note") ?? "") || null,
  });

  const newPaid = parseFloat(debt.paidAmount) + parseFloat(amount);
  const isPaid = newPaid >= parseFloat(debt.totalAmount);
  await db
    .update(debts)
    .set({
      paidAmount: sql`${debts.paidAmount} + ${amount}`,
      status: isPaid ? "paid" : debt.status,
      updatedAt: new Date(),
    })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)));

  revalidateAll();
}
