"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profiles } from "@/db/schema";
import { requireUserId } from "./helpers";

function parseSalaryDay(formData: FormData): number | null {
  const raw = String(formData.get("salaryDay") ?? "").trim();
  if (!raw) return null;
  const day = Number(raw);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
}

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
      salaryDay: parseSalaryDay(formData),
      onboardingDone: true,
    })
    .where(eq(profiles.userId, userId));

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Modification du profil depuis le dashboard (solde, salaire, jour de versement). */
export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();
  const initialBalance = String(formData.get("initialBalance") ?? "0");
  const monthlySalary = String(formData.get("monthlySalary") ?? "0");

  await db
    .update(profiles)
    .set({
      initialBalance,
      monthlySalary,
      salaryDay: parseSalaryDay(formData),
    })
    .where(eq(profiles.userId, userId));

  revalidatePath("/dashboard");
}
