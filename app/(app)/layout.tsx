import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile, getCategories } from "@/db/queries";
import { BottomNav } from "@/components/layout/BottomNav";
import { Fab } from "@/components/layout/Fab";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getProfile(session.user.id);
  if (profile && !profile.onboardingDone) redirect("/onboarding");

  const categories = await getCategories(session.user.id);

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-28 pt-4">
      {children}
      <Fab categories={categories} />
      <BottomNav />
    </div>
  );
}
