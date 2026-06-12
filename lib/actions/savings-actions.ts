"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { savingsProjects, savingsContributions } from "@/db/schema";
import { requireUserId } from "./helpers";

function revalidateAll() {
  revalidatePath("/savings");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function createSavingsProject(formData: FormData) {
  const userId = await requireUserId();
  await db.insert(savingsProjects).values({
    id: crypto.randomUUID(),
    userId,
    name: String(formData.get("name")),
    goalAmount: String(formData.get("goalAmount")),
    savedAmount: String(formData.get("savedAmount") ?? "0") || "0",
    targetDate: String(formData.get("targetDate") ?? "") || null,
    color: String(formData.get("color") ?? "") || null,
  });
  revalidateAll();
}

export async function updateSavingsProject(id: string, formData: FormData) {
  const userId = await requireUserId();
  await db
    .update(savingsProjects)
    .set({
      name: String(formData.get("name")),
      goalAmount: String(formData.get("goalAmount")),
      targetDate: String(formData.get("targetDate") ?? "") || null,
      color: String(formData.get("color") ?? "") || null,
      updatedAt: new Date(),
    })
    .where(and(eq(savingsProjects.id, id), eq(savingsProjects.userId, userId)));
  revalidateAll();
}

export async function deleteSavingsProject(id: string) {
  const userId = await requireUserId();
  await db
    .delete(savingsProjects)
    .where(and(eq(savingsProjects.id, id), eq(savingsProjects.userId, userId)));
  revalidateAll();
}

/** Versement dans un pot d'épargne — incrémente saved_amount. */
export async function addSavingsContribution(formData: FormData) {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId"));
  const amount = String(formData.get("amount"));

  await db.insert(savingsContributions).values({
    id: crypto.randomUUID(),
    userId,
    projectId,
    amount,
    date: String(formData.get("date")),
    note: String(formData.get("note") ?? "") || null,
  });

  await db
    .update(savingsProjects)
    .set({
      savedAmount: sql`${savingsProjects.savedAmount} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(
      and(eq(savingsProjects.id, projectId), eq(savingsProjects.userId, userId))
    );
  revalidateAll();
}
