"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { investments, investmentCategories } from "@/db/schema";
import { requireUserId } from "./helpers";

export async function createInvestment(formData: FormData) {
  const userId = await requireUserId();
  await db.insert(investments).values({
    id: crypto.randomUUID(),
    userId,
    categoryId: String(formData.get("categoryId")),
    assetName: String(formData.get("assetName")),
    amountInvested: String(formData.get("amountInvested")),
    currentValue: String(formData.get("currentValue") ?? "") || null,
    investmentDate: String(formData.get("investmentDate")),
    note: String(formData.get("note") ?? "") || null,
  });
  revalidatePath("/investments");
}

export async function updateInvestment(id: string, formData: FormData) {
  const userId = await requireUserId();
  await db
    .update(investments)
    .set({
      categoryId: String(formData.get("categoryId")),
      assetName: String(formData.get("assetName")),
      amountInvested: String(formData.get("amountInvested")),
      currentValue: String(formData.get("currentValue") ?? "") || null,
      investmentDate: String(formData.get("investmentDate")),
      note: String(formData.get("note") ?? "") || null,
      updatedAt: new Date(),
    })
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
  revalidatePath("/investments");
}

export async function deleteInvestment(id: string) {
  const userId = await requireUserId();
  await db
    .delete(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
  revalidatePath("/investments");
}

export async function createInvestmentCategory(formData: FormData) {
  const userId = await requireUserId();
  await db.insert(investmentCategories).values({
    id: crypto.randomUUID(),
    userId,
    name: String(formData.get("name")),
    color: String(formData.get("color") ?? "") || null,
    isDefault: false,
  });
  revalidatePath("/investments");
}
