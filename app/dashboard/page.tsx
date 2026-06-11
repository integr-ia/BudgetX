"use client";

import Link from "next/link";
import { addDays } from "date-fns";
import { BarChart3, TrendingDown, TrendingUp, Scale, AlertTriangle, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDbQuery } from "@/hooks/useDbQuery";
import * as schema from "@/db/schema";
import { getMonthlyStats, getRealBalance } from "@/db/queries/stats";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate, todayISO, toISODate } from "@/utils/dates";

export default function DashboardPage() {
  const { data, loading } = useDbQuery(async (db) => {
    const stats = await getMonthlyStats(db, new Date());
    const balance = await getRealBalance(db);
    const [prof] = await db.select().from(schema.profile);
    const debts = await db.select().from(schema.debts);
    const txs = await db.select().from(schema.transactions);

    const today = todayISO();
    const in7days = toISODate(addDays(new Date(), 7));
    const upcoming = txs
      .filter((t) => t.date > today && t.date <= in7days)
      .sort((a, b) => a.date.localeCompare(b.date));

    return { stats, balance, prof, debts, upcoming };
  });

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
      </>
    );
  }

  const { stats, balance, prof, debts, upcoming } = data;
  const salary = toNumber(prof?.monthlySalary);
  const budgetUsed = salary > 0 ? Math.min((stats.expenses / salary) * 100, 100) : 0;

  const activeDebts = debts.filter((d) => d.status === "active");
  const totalDebtRemaining = activeDebts.reduce(
    (s, d) => s + Math.max(toNumber(d.totalAmount) - toNumber(d.paidAmount), 0),
    0
  );
  const pursuitsRemaining = activeDebts
    .filter((d) => d.type === "pursuit")
    .reduce((s, d) => s + Math.max(toNumber(d.totalAmount) - toNumber(d.paidAmount), 0), 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        action={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Analyses"
            render={<Link href="/analytics" />}
          >
            <BarChart3 className="size-5" />
          </Button>
        }
      />
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solde net du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold tabular-nums ${
                stats.net >= 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {formatCHF(stats.net)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Solde réel estimé : {formatCHF(balance)}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<TrendingUp className="size-4 text-emerald-500" />}
            label="Revenus"
            value={formatCHF(stats.income)}
          />
          <StatCard
            icon={<TrendingDown className="size-4 text-red-500" />}
            label="Dépenses"
            value={formatCHF(stats.expenses)}
          />
          <StatCard
            icon={<Scale className="size-4 text-orange-500" />}
            label="Dettes"
            value={formatCHF(totalDebtRemaining)}
          />
        </div>

        {pursuitsRemaining > 0 && (
          <Card className="border-orange-500/40">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="size-5 shrink-0 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Poursuites en cours</p>
                <p className="text-sm text-muted-foreground">
                  Restant dû : {formatCHF(pursuitsRemaining)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Budget mensuel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={budgetUsed} />
            <p className="text-xs text-muted-foreground">
              {formatCHF(stats.expenses)} dépensés sur {formatCHF(salary)} de salaire (
              {budgetUsed.toFixed(0)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PiggyBank className="size-4" /> Épargne ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tabular-nums">
              {formatCHF(stats.savingsContributed)}
            </p>
            <p className="text-xs text-muted-foreground">
              Taux d&apos;épargne : {stats.savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              À venir (7 prochains jours)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun paiement planifié.</p>
            )}
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div>
                  <span>{t.note || (t.type === "expense" ? "Dépense" : "Revenu")}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatDate(t.date)}
                  </span>
                </div>
                <Badge variant={t.type === "expense" ? "destructive" : "default"}>
                  {t.type === "expense" ? "−" : "+"}
                  {formatCHF(toNumber(t.amount))}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
