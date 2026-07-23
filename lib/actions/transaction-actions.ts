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
  const isRecurring = !!recurrence && recurrence !== "none";
  const id = crypto.randomUUID();

  await db.insert(transactions).values({
    id,
    userId,
    type: String(formData.get("type")),
    amount: String(formData.get("amount")),
    categoryId: String(formData.get("categoryId")),
    date: String(formData.get("date")),
    note: String(formData.get("note") ?? "") || null,
    isRecurring,
    recurrence: isRecurring ? recurrence : null,
    recurrenceEnd: String(formData.get("recurrenceEnd") ?? "") || null,
    // La transaction d'origine est la tête de sa propre série d'occurrences.
    seriesId: isRecurring ? id : null,
  });
  revalidateAll();
}

export async function updateTransaction(id: string, formData: FormData) {
  const userId = await requireUserId();
  const recurrence = String(formData.get("recurrence") ?? "");
  const isRecurring = !!recurrence && recurrence !== "none";

  const [existing] = await db
    .select({ seriesId: transactions.seriesId })
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .limit(1);

  await db
    .update(transactions)
    .set({
      type: String(formData.get("type")),
      amount: String(formData.get("amount")),
      categoryId: String(formData.get("categoryId")),
      date: String(formData.get("date")),
      note: String(formData.get("note") ?? "") || null,
      isRecurring,
      recurrence: isRecurring ? recurrence : null,
      recurrenceEnd: String(formData.get("recurrenceEnd") ?? "") || null,
      // Rattache à une série existante, ou en démarre une nouvelle si la
      // récurrence vient d'être activée sur une transaction qui n'en avait pas.
      seriesId: isRecurring ? existing?.seriesId ?? id : existing?.seriesId ?? null,
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
