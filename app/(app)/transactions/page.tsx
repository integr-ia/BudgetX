import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getTransactions,
  getCategories,
  getProfile,
  materializeRecurringTransactions,
} from "@/db/queries";
import { toNumber } from "@/utils/currency";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionsClient } from "./TransactionsClient";

export const metadata = { title: "Transactions — BudgetX" };
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await materializeRecurringTransactions(session.user.id);

  const [rows, categories, profile] = await Promise.all([
    getTransactions(session.user.id),
    getCategories(session.user.id),
    getProfile(session.user.id),
  ]);

  return (
    <>
      <PageHeader title="Transactions" />
      <TransactionsClient
        rows={rows}
        categories={categories}
        initialBalance={toNumber(profile?.initialBalance)}
      />
    </>
  );
}
