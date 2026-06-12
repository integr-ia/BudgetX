import { auth } from "@/lib/auth";

/** Retourne le user_id de la session ou lève une erreur. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Non authentifié");
  return userId;
}
