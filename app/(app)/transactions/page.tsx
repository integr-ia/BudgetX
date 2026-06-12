import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTransactions, getCategories } from "@/db/queries";
import { PageHeader } from "@/components/layout/PageHeader";
import { TransactionsClient } from "./TransactionsClient";

export const metadata = { title: "Transactions — BudgetX" };
export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rows, categories] = await Promise.all([
    getTransactions(session.user.id),
    getCategories(session.user.id),
  ]);

  return (
    <>
      <PageHeader title="Transactions" />
      <TransactionsClient rows={rows} categories={categories} />
    </>
  );
}
