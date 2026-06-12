import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getInvestments, getInvestmentCategories } from "@/db/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { InvestmentsClient } from "./InvestmentsClient";

export const metadata = { title: "Investissements — BudgetX" };
export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rows, categories] = await Promise.all([
    getInvestments(session.user.id),
    getInvestmentCategories(session.user.id),
  ]);

  return (
    <>
      <PageHeader title="Investissements" />
      <InvestmentsClient rows={rows} categories={categories} />
    </>
  );
}
