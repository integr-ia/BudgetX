"use client";

import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDbQuery } from "@/hooks/useDbQuery";
import * as schema from "@/db/schema";
import {
  getMonthlyHistory,
  getMonthlyStats,
  getRealBalance,
  estimatedEndDate,
} from "@/db/queries/stats";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatMonth, formatDate, todayISO } from "@/utils/dates";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
import { toISODate } from "@/utils/dates";

export default function AnalyticsPage() {
  const [range, setRange] = useState<"6" | "12">("6");

  const { data, loading } = useDbQuery(async (db) => {
    const history = await getMonthlyHistory(db, 12);
    const stats = await getMonthlyStats(db, new Date());
    const balance = await getRealBalance(db);
    const txs = await db.select().from(schema.transactions);
    const cats = await db.select().from(schema.categories);
    const debts = await db.select().from(schema.debts);
    const projects = await db.select().from(schema.savingsProjects);

    // Répartition des dépenses du mois en cours par catégorie (réalisées)
    const from = toISODate(startOfMonth(new Date()));
    const to = toISODate(endOfMonth(new Date()));
    const today = todayISO();
    const cap = to < today ? to : today;
    const byCat = new Map<string, number>();
    for (const t of txs) {
      if (t.type === "expense" && t.date >= from && t.date <= cap) {
        byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + toNumber(t.amount));
      }
    }
    const catById = new Map(cats.map((c) => [c.id, c]));
    const donut = [...byCat.entries()]
      .map(([id, value]) => ({
        name: catById.get(id)?.name ?? "Autre",
        color: catById.get(id)?.color ?? "#737373",
        value,
      }))
      .sort((a, b) => b.value - a.value);

    return { history, stats, balance, donut, debts, projects };
  });

  if (loading || !data) {
    return (
      <>
        <PageHeader title="Analyses" />
        <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
      </>
    );
  }

  const { history, balance, donut, debts, projects } = data;
  const months = parseInt(range);
  const shown = history.slice(-months);

  const lineData = shown.map((h) => ({
    month: formatMonth(h.month),
    net: Math.round(h.net * 100) / 100,
  }));
  const barData = shown.map((h) => ({
    month: formatMonth(h.month),
    revenus: Math.round(h.income * 100) / 100,
    dépenses: Math.round(h.expenses * 100) / 100,
  }));

  // Projections : moyenne des 3 derniers mois réalisés
  const last3 = history.slice(-3);
  const avgIncome = last3.reduce((s, h) => s + h.income, 0) / Math.max(last3.length, 1);
  const avgExpenses = last3.reduce((s, h) => s + h.expenses, 0) / Math.max(last3.length, 1);
  const avgNet = last3.reduce((s, h) => s + h.net, 0) / Math.max(last3.length, 1);
  const avgSavings =
    last3.reduce((s, h) => s + h.savingsContributed, 0) / Math.max(last3.length, 1);

  const projections = [3, 6, 12].map((n) => ({
    n,
    balance: balance + avgNet * n,
  }));

  const activeDebts = debts.filter((d) => d.status === "active");
  const debtEndDates = activeDebts
    .map((d) => estimatedEndDate(d))
    .filter((d): d is Date => d !== null);
  const debtFreeDate =
    debtEndDates.length > 0
      ? new Date(Math.max(...debtEndDates.map((d) => d.getTime())))
      : null;

  const top5 = donut.slice(0, 5);
  const currentSavingsRate = data.stats.savingsRate;

  return (
    <>
      <PageHeader
        title="Analyses"
        action={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Retour au dashboard"
            render={<Link href="/dashboard" />}
          >
            <ArrowLeft className="size-5" />
          </Button>
        }
      />
      <div className="space-y-4 p-4">
        {avgExpenses > avgIncome && (
          <Card className="border-red-500/50">
            <CardContent className="flex items-center gap-3 py-3">
              <AlertTriangle className="size-5 shrink-0 text-red-500" />
              <p className="text-sm">
                Attention : vos dépenses projetées ({formatCHF(avgExpenses)}/mois)
                dépassent vos revenus projetés ({formatCHF(avgIncome)}/mois).
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dépenses par catégorie (mois en cours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donut.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune dépense ce mois.</p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {donut.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCHF(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {top5.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Top 5 catégories
                </p>
                {top5.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="tabular-nums">{formatCHF(c.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <TabsList className="w-full">
            <TabsTrigger value="6" className="flex-1">6 mois</TabsTrigger>
            <TabsTrigger value="12" className="flex-1">12 mois</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Évolution du solde net mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={10} width={50} />
                  <Tooltip formatter={(v) => formatCHF(Number(v))} />
                  <Line type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus vs Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={10} width={50} />
                  <Tooltip formatter={(v) => formatCHF(Number(v))} />
                  <Legend />
                  <Bar dataKey="revenus" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="dépenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux d&apos;épargne du mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{currentSavingsRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projections (basées sur la moyenne des 3 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {projections.map((p) => (
              <div key={p.n} className="flex justify-between">
                <span className="text-muted-foreground">Solde dans {p.n} mois</span>
                <span
                  className={`font-medium tabular-nums ${
                    p.balance >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {formatCHF(p.balance)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Dettes soldées le</span>
              <span className="font-medium">
                {debtFreeDate ? formatDate(debtFreeDate) : "—"}
              </span>
            </div>
            {projects.map((p) => {
              const remaining = Math.max(
                toNumber(p.goalAmount) - toNumber(p.savedAmount),
                0
              );
              const monthsNeeded =
                remaining === 0 ? 0 : avgSavings > 0 ? Math.ceil(remaining / avgSavings) : null;
              const eta =
                monthsNeeded === 0
                  ? "Atteint ✓"
                  : monthsNeeded !== null
                    ? formatDate(addMonths(new Date(), monthsNeeded))
                    : "—";
              return (
                <div key={p.id} className="flex justify-between">
                  <span className="truncate text-muted-foreground">Objectif « {p.name} »</span>
                  <span className="font-medium">{eta}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
