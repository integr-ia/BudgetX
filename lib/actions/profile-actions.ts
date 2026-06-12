"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { requireUserId } from "./helpers";

/** Onboarding : solde bancaire courant + salaire mensuel net. */
export async function completeOnboarding(formData: FormData) {
  const userId = await requireUserId();
  const initialBalance = String(formData.get("initialBalance") ?? "0");
  const monthlySalary = String(formData.get("monthlySalary") ?? "0");

  await db
    .update(profiles)
    .set({
      initialBalance,
      monthlySalary,
      onboardingDone: true,
    })
    .where(eq(profiles.userId, userId));

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
