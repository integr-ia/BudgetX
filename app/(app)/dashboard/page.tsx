import { redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Gavel,
  HandCoins,
  PiggyBank,
} from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import {
  getProfile,
  getMonthSummary,
  getRealBalance,
  getProjectedBalance,
  getActiveDebtTotals,
  getUpcoming,
  materializeRecurringTransactions,
} from "@/db/queries";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate, formatMonth } from "@/utils/dates";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";

export const metadata = { title: "Dashboard — BudgetX" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  await materializeRecurringTransactions(userId);

  const [profile, summary, realBalance, projectedBalance, debtTotals, upcoming] =
    await Promise.all([
      getProfile(userId),
      getMonthSummary(userId),
      getRealBalance(userId),
      getProjectedBalance(userId),
      getActiveDebtTotals(userId),
      getUpcoming(userId),
    ]);

  const salary = toNumber(profile?.monthlySalary);
  const budgetUsedPct = salary > 0 ? (summary.expenses / salary) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        action={
          <>
          <Button variant="secondary" size="sm" asChild>
            <a href="/analytics">Analyses</a>
          </Button>
          <ProfileSettings profile={profile} />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" type="submit">
              Déconnexion
            </Button>
          </form>
          </>
        }
      />

      {/* Solde réel + solde du mois */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Solde réel</p>
          <p className="text-3xl font-bold tracking-tight">
            {formatCHF(realBalance)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Solde net de {formatMonth(new Date())} :{" "}
            <span
              className={
                summary.netBalance >= 0 ? "text-primary" : "text-destructive"
              }
            >
              {formatCHF(summary.netBalance)}
            </span>
          </p>
          {projectedBalance ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Solde projeté au {formatDate(projectedBalance.nextSalaryDate)} :{" "}
              <span
                className={
                  projectedBalance.amount >= 0
                    ? "text-primary"
                    : "text-destructive"
                }
              >
                {formatCHF(projectedBalance.amount)}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Renseignez votre jour de salaire dans les paramètres pour voir
              le solde projeté.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Résumé rapide */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpRight className="size-3.5 text-primary" /> Revenus du mois
            </div>
            <p className="mt-1 font-semibold">{formatCHF(summary.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowDownRight className="size-3.5 text-destructive" /> Dépenses du mois
            </div>
            <p className="mt-1 font-semibold">{formatCHF(summary.expenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HandCoins className="size-3.5 text-amber-500" /> Dettes actives
            </div>
            <p className="mt-1 font-semibold">
              {formatCHF(debtTotals.totalRemaining)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Gavel className="size-3.5 text-red-400" /> Poursuites
            </div>
            <p className="mt-1 font-semibold">
              {formatCHF(debtTotals.pursuitsRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget mensuel */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Budget mensuel</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={budgetUsedPct} />
          <p className="mt-2 text-xs text-muted-foreground">
            {formatCHF(summary.expenses)} dépensés sur {formatCHF(salary)} de
            salaire ({budgetUsedPct.toFixed(0)} %)
          </p>
        </CardContent>
      </Card>

      {/* Épargne du mois */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <PiggyBank className="size-4 text-primary" /> Épargne ce mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">
            {formatCHF(summary.savingsContributed)}
          </p>
          <p className="text-xs text-muted-foreground">
            Taux d&apos;épargne : {summary.savingsRate.toFixed(1)} % des revenus
          </p>
        </CardContent>
      </Card>

      {/* Prochains paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <CalendarClock className="size-4" /> À venir (7 jours)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.upcomingTx.length === 0 &&
            upcoming.activeDebtsWithPayment.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucun paiement planifié.
              </p>
            )}
          {upcoming.upcomingTx.map(({ transaction: t, category }) => (
            <div key={t.id} className="flex items-center justify-between text-sm">
              <span>
                {category.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatDate(t.date)}
                </span>
              </span>
              <span
                className={
                  t.type === "income" ? "text-primary" : "text-destructive"
                }
              >
                {t.type === "income" ? "+" : "−"}
                {formatCHF(t.amount)}
              </span>
            </div>
          ))}
          {upcoming.activeDebtsWithPayment.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <span>
                Mensualité — {d.name}
                <span className="ml-2 text-xs text-muted-foreground">
                  mensuel
                </span>
              </span>
              <span className="text-destructive">
                −{formatCHF(d.monthlyPayment ?? 0)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
