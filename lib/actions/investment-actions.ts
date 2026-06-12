"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  investments,
  investmentCategories,
  investmentWithdrawals,
} from "@/db/schema";
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

export async function divestInvestment(id: string, formData: FormData) {
  const userId = await requireUserId();
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) return;

  const [inv] = await db
    .select()
    .from(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
  if (!inv) return;

  const current = Number(inv.currentValue ?? inv.amountInvested);
  const invested = Number(inv.amountInvested);
  const withdrawn = Math.min(amount, current);

  await db.insert(investmentWithdrawals).values({
    id: crypto.randomUUID(),
    userId,
    investmentId: id,
    amount: withdrawn.toFixed(2),
    date: String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10),
    note: String(formData.get("note") ?? "") || null,
  });

  // Retrait partiel : la valeur baisse du montant retiré, le montant investi
  // est réduit dans la même proportion pour conserver le gain/perte relatif.
  // Retrait total : l'investissement passe à zéro mais reste visible avec son historique.
  const ratio = current > 0 ? (current - withdrawn) / current : 0;
  await db
    .update(investments)
    .set({
      amountInvested: (invested * ratio).toFixed(2),
      currentValue: (current - withdrawn).toFixed(2),
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
