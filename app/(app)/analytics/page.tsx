import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getExpensesByCategory,
  getMonthlyHistory,
  getRealBalance,
  getDebts,
  getSavingsProjects,
} from "@/db/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsClient } from "./AnalyticsClient";

export const metadata = { title: "Analyses — BudgetX" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [byCategory, history12, realBalance, debts, savings] =
    await Promise.all([
      getExpensesByCategory(userId),
      getMonthlyHistory(userId, 12),
      getRealBalance(userId),
      getDebts(userId),
      getSavingsProjects(userId),
    ]);

  return (
    <>
      <PageHeader title="Analyses" />
      <AnalyticsClient
        byCategory={byCategory.map((c) => ({
          name: c.name,
          color: c.color,
          total: parseFloat(c.total),
        }))}
        history={history12}
        realBalance={realBalance}
        debts={debts}
        savings={savings}
      />
    </>
  );
}
