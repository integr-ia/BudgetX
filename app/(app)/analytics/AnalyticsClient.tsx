"use client";

import { useMemo, useState } from "react";
import { addMonths } from "date-fns";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Debt, SavingsProject } from "@/db/schema";
import type { MonthlyPoint } from "@/db/queries";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate } from "@/utils/dates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FALLBACK_COLORS = [
  "#22c55e", "#3b82f6", "#f97316", "#ec4899", "#8b5cf6",
  "#06b6d4", "#eab308", "#ef4444", "#14b8a6", "#6366f1", "#64748b",
];

export function AnalyticsClient({
  byCategory,
  history,
  realBalance,
  debts,
  savings,
}: {
  byCategory: { name: string; color: string | null; total: number }[];
  history: MonthlyPoint[];
  realBalance: number;
  debts: Debt[];
  savings: SavingsProject[];
}) {
  const [range, setRange] = useState<6 | 12>(6);
  const shown = useMemo(() => history.slice(-range), [history, range]);

  // Projections basées sur la moyenne des 3 derniers mois
  const last3 = history.slice(-3);
  const avgNet =
    last3.length > 0
      ? last3.reduce((s, p) => s + p.net, 0) / last3.length
      : 0;
  const avgSavings =
    last3.length > 0 ? Math.max(0, avgNet) : 0;

  const activeDebts = debts.filter((d) => d.status === "active");

  return (
    <div className="space-y-4">
      {/* Donut répartition dépenses */}
      <Card>
        <CardHeader>
          <CardTitle>Dépenses du mois par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune dépense ce mois.
            </p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byCategory}
                      dataKey="total"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {byCategory.map((c, i) => (
                        <Cell
                          key={c.name}
                          fill={c.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCHF(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {byCategory.map((c, i) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            c.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                        }}
                      />
                      {c.name}
                    </span>
                    <span className="font-medium">{formatCHF(c.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Solde net 6/12 mois */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Solde net mensuel
            <span className="flex gap-1">
              {([6, 12] as const).map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={range === r ? "default" : "secondary"}
                  onClick={() => setRange(r)}
                >
                  {r} mois
                </Button>
              ))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shown}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => formatCHF(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Solde net"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenus vs Dépenses */}
      <Card>
        <CardHeader>
          <CardTitle>Revenus vs Dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shown}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => formatCHF(Number(v))} />
                <Bar dataKey="income" name="Revenus" fill="#22c55e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Dépenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Projections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">
              Solde projeté (moyenne du solde net des 3 derniers mois :{" "}
              {formatCHF(avgNet)}/mois)
            </p>
            <div className="mt-1 grid grid-cols-3 gap-2 text-center">
              {[3, 6, 12].map((m) => (
                <div key={m} className="rounded-lg bg-secondary p-2">
                  <p className="text-[10px] text-muted-foreground">
                    Dans {m} mois
                  </p>
                  <p className="text-xs font-semibold">
                    {formatCHF(realBalance + avgNet * m)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {activeDebts.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">
                Remboursement des dettes
              </p>
              {activeDebts.map((d) => {
                const remaining = toNumber(d.totalAmount) - toNumber(d.paidAmount);
                const monthly = d.monthlyPayment
                  ? toNumber(d.monthlyPayment)
                  : null;
                const months =
                  monthly && monthly > 0 ? Math.ceil(remaining / monthly) : null;
                return (
                  <p key={d.id} className="mt-1 flex justify-between">
                    <span>{d.name}</span>
                    <span className="text-muted-foreground">
                      {months !== null
                        ? `soldée le ${formatDate(addMonths(new Date(), months))}`
                        : "pas de mensualité définie"}
                    </span>
                  </p>
                );
              })}
            </div>
          )}

          {savings.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">
                Objectifs d&apos;épargne
              </p>
              {savings.map((p) => {
                const remaining =
                  toNumber(p.goalAmount) - toNumber(p.savedAmount);
                const months =
                  avgSavings > 0 && remaining > 0
                    ? Math.ceil(remaining / avgSavings)
                    : null;
                return (
                  <p key={p.id} className="mt-1 flex justify-between">
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">
                      {remaining <= 0
                        ? "objectif atteint 🎉"
                        : months !== null
                          ? `atteint vers ${formatDate(addMonths(new Date(), months))}`
                          : "rythme d'épargne insuffisant"}
                    </span>
                  </p>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
