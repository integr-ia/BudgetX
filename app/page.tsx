import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile } from "@/db/queries";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getProfile(session.user.id);
  if (profile && !profile.onboardingDone) redirect("/onboarding");
  redirect("/dashboard");
}
