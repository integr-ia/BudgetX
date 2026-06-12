import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSavingsProjects } from "@/db/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { SavingsClient } from "./SavingsClient";

export const metadata = { title: "Épargne — BudgetX" };
export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await getSavingsProjects(session.user.id);

  return (
    <>
      <PageHeader title="Épargne" />
      <SavingsClient projects={projects} />
    </>
  );
}
