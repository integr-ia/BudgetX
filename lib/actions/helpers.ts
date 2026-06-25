import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/db/schema";

/** Retourne le user_id de la session ou lève une erreur. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non authentifié");
  return userId;
}

/** Vrai si la case "Ajouter aux transactions" d'un formulaire est cochée. */
export function isChecked(formData: FormData, field: string): boolean {
  const value = formData.get(field);
  return value === "on" || value === "true";
}

/**
 * Catégorie utilisée pour les transactions miroir générées automatiquement
 * (remboursement de dette, versement d'épargne, investissement…).
 * Réutilise la catégorie si elle existe déjà pour cet utilisateur.
 */
export async function getOrCreateMirrorCategory(
  userId: string,
  name: string,
  type: "expense" | "income"
): Promise<string> {
  const [existing] = await db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.userId, userId),
        eq(categories.name, name),
        eq(categories.type, type)
      )
    )
    .limit(1);
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  await db.insert(categories).values({ id, userId, name, type, isDefault: false });
  return id;
}
