import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDebts, getActiveDebtTotals } from "@/db/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { DebtsClient } from "./DebtsClient";

export const metadata = { title: "Dettes — BudgetX" };
export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [debts, totals] = await Promise.all([
    getDebts(session.user.id),
    getActiveDebtTotals(session.user.id),
  ]);

  return (
    <>
      <PageHeader title="Dettes" />
      <DebtsClient debts={debts} totals={totals} />
    </>
  );
}
