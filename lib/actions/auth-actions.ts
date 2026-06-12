"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  profiles,
  categories,
  investmentCategories,
} from "@/db/schema";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVESTMENT_CATEGORIES,
} from "@/constants/categories";
import { signIn } from "@/lib/auth";

export type AuthResult = { error?: string };

/**
 * Crée le compte, le profil (onboarding_done = false) et seed
 * les catégories par défaut pour ce user_id (règle métier n°8).
 */
export async function registerUser(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Adresse e-mail invalide." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return { error: "Un compte existe déjà avec cette adresse e-mail." };
  }

  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({ id: userId, email, passwordHash });
  await db.insert(profiles).values({ id: userId, userId });

  // Seed des catégories par défaut
  await db.insert(categories).values([
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      id: crypto.randomUUID(),
      userId,
      name: c.name,
      type: "expense",
      icon: c.icon,
      color: c.color,
      isDefault: true,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
      id: crypto.randomUUID(),
      userId,
      name: c.name,
      type: "income",
      icon: c.icon,
      color: c.color,
      isDefault: true,
    })),
  ]);
  await db.insert(investmentCategories).values(
    DEFAULT_INVESTMENT_CATEGORIES.map((c) => ({
      id: crypto.randomUUID(),
      userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    }))
  );

  await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  return {};
}

export async function loginUser(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  // Redirection onboarding si non terminé
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let redirectTo = "/dashboard";
  if (user) {
    const [profile] = await db
      .select({ onboardingDone: profiles.onboardingDone })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);
    if (profile && !profile.onboardingDone) redirectTo = "/onboarding";
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    // signIn lève NEXT_REDIRECT en cas de succès — on le relance
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: "E-mail ou mot de passe incorrect." };
  }
  return {};
}
