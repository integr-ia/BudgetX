"use client";

import { useState } from "react";
import { eq } from "drizzle-orm";
import { Pencil, Plus, Trash2, Banknote, Pause, Play } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DebtFormDialog } from "@/components/forms/DebtFormDialog";
import { DebtPaymentDialog } from "@/components/forms/DebtPaymentDialog";
import { useDbQuery, mutate } from "@/hooks/useDbQuery";
import * as schema from "@/db/schema";
import type { Debt } from "@/db/schema";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate } from "@/utils/dates";
import { remainingInstallments, estimatedEndDate } from "@/db/queries/stats";

const STATUS_LABELS: Record<string, string> = {
  active: "En cours",
  paid: "Soldée",
  paused: "En pause",
};

export default function DebtsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  const { data: debts, loading } = useDbQuery((db) => db.select().from(schema.debts));

  const list = (debts ?? []).sort((a, b) =>
    a.status === b.status ? a.name.localeCompare(b.name) : a.status === "active" ? -1 : 1
  );
  const totalRemaining = list
    .filter((d) => d.status !== "paid")
    .reduce((s, d) => s + Math.max(toNumber(d.totalAmount) - toNumber(d.paidAmount), 0), 0);

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette dette et tous ses paiements ?")) return;
    await mutate(async (db) => {
      await db.delete(schema.debtPayments).where(eq(schema.debtPayments.debtId, id));
      await db.delete(schema.debts).where(eq(schema.debts.id, id));
    });
  };

  const togglePause = async (d: Debt) => {
    const status = d.status === "paused" ? "active" : "paused";
    await mutate((db) =>
      db.update(schema.debts).set({ status, updatedAt: new Date() }).where(eq(schema.debts.id, d.id))
    );
  };

  return (
    <>
      <PageHeader
        title="Dettes & Poursuites"
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            aria-label="Ajouter une dette"
          >
            <Plus className="size-5" />
          </Button>
        }
      />
      <div className="space-y-4 p-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">Total restant dû</p>
            <p className="text-2xl font-bold tabular-nums text-orange-500">
              {formatCHF(totalRemaining)}
            </p>
          </CardContent>
        </Card>

        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!loading && list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune dette enregistrée.
          </p>
        )}

        {list.map((d) => {
          const total = toNumber(d.totalAmount);
          const paid = toNumber(d.paidAmount);
          const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
          const remaining = remainingInstallments(d);
          const endDate = estimatedEndDate(d);
          return (
            <Card key={d.id}>
              <CardContent className="space-y-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {d.name}
                      {d.creditor && (
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          · {d.creditor}
                        </span>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {d.type === "pursuit" && (
                        <Badge variant="destructive">Poursuite</Badge>
                      )}
                      <Badge variant={d.status === "paid" ? "default" : "secondary"}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </Badge>
                      {d.pursuitNumber && (
                        <Badge variant="outline">N° {d.pursuitNumber}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => togglePause(d)} aria-label={d.status === "paused" ? "Reprendre" : "Mettre en pause"}>
                      {d.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setEditing(d);
                        setFormOpen(true);
                      }}
                      aria-label="Modifier"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-red-500" onClick={() => remove(d.id)} aria-label="Supprimer">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    {formatCHF(paid)} / {formatCHF(total)} ({pct.toFixed(0)}%)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>Mensualité : {formatCHF(toNumber(d.monthlyPayment))}</p>
                  <p>Mensualités restantes : {remaining}</p>
                  <p>Début : {formatDate(d.startDate)}</p>
                  <p>Fin estimée : {endDate ? formatDate(endDate) : "—"}</p>
                </div>

                {d.status !== "paid" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setPayingDebt(d)}
                  >
                    <Banknote className="mr-2 size-4" /> Enregistrer un remboursement
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DebtFormDialog open={formOpen} onOpenChange={setFormOpen} debt={editing} />
      <DebtPaymentDialog
        debt={payingDebt}
        onOpenChange={(o) => !o && setPayingDebt(null)}
      />
    </>
  );
}
