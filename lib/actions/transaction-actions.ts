"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { transactions, categories } from "@/db/schema";
import { requireUserId } from "./helpers";

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/analytics");
}

export async function createTransaction(formData: FormData) {
  const userId = await requireUserId();
  const recurrence = String(formData.get("recurrence") ?? "");

  await db.insert(transactions).values({
    id: crypto.randomUUID(),
    userId,
    type: String(formData.get("type")),
    amount: String(formData.get("amount")),
    categoryId: String(formData.get("categoryId")),
    date: String(formData.get("date")),
    note: String(formData.get("note") ?? "") || null,
    isRecurring: !!recurrence && recurrence !== "none",
    recurrence: recurrence && recurrence !== "none" ? recurrence : null,
    recurrenceEnd: String(formData.get("recurrenceEnd") ?? "") || null,
  });
  revalidateAll();
}

export async function updateTransaction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const recurrence = String(formData.get("recurrence") ?? "");

  await db
    .update(transactions)
    .set({
      type: String(formData.get("type")),
      amount: String(formData.get("amount")),
      categoryId: String(formData.get("categoryId")),
      date: String(formData.get("date")),
      note: String(formData.get("note") ?? "") || null,
      isRecurring: !!recurrence && recurrence !== "none",
      recurrence: recurrence && recurrence !== "none" ? recurrence : null,
      recurrenceEnd: String(formData.get("recurrenceEnd") ?? "") || null,
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  revalidateAll();
}

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  revalidateAll();
}

export async function createCategory(formData: FormData) {
  const userId = await requireUserId();
  await db.insert(categories).values({
    id: crypto.randomUUID(),
    userId,
    name: String(formData.get("name")),
    type: String(formData.get("type")),
    color: String(formData.get("color") ?? "") || null,
    isDefault: false,
  });
  revalidatePath("/transactions");
}

export async function renameCategory(id: string, name: string) {
  const userId = await requireUserId();
  await db
    .update(categories)
    .set({ name })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));
  revalidatePath("/transactions");
}

/** Règle métier n°7 : les catégories par défaut ne sont pas supprimables. */
export async function deleteCategory(id: string) {
  const userId = await requireUserId();
  await db
    .delete(categories)
    .where(
      and(
        eq(categories.id, id),
        eq(categories.userId, userId),
        eq(categories.isDefault, false)
      )
    );
  revalidatePath("/transactions");
}
