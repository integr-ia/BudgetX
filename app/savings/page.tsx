"use client";

import { useState } from "react";
import { eq } from "drizzle-orm";
import { Pencil, Plus, Trash2, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SavingsProjectFormDialog } from "@/components/forms/SavingsProjectFormDialog";
import { SavingsContributionDialog } from "@/components/forms/SavingsContributionDialog";
import { useDbQuery, mutate } from "@/hooks/useDbQuery";
import * as schema from "@/db/schema";
import type { SavingsProject } from "@/db/schema";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate } from "@/utils/dates";

export default function SavingsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsProject | null>(null);
  const [contributing, setContributing] = useState<SavingsProject | null>(null);

  const { data: projects, loading } = useDbQuery((db) =>
    db.select().from(schema.savingsProjects)
  );

  const list = projects ?? [];
  const totalSaved = list.reduce((s, p) => s + toNumber(p.savedAmount), 0);

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce projet d'épargne et ses versements ?")) return;
    await mutate(async (db) => {
      await db
        .delete(schema.savingsContributions)
        .where(eq(schema.savingsContributions.projectId, id));
      await db.delete(schema.savingsProjects).where(eq(schema.savingsProjects.id, id));
    });
  };

  return (
    <>
      <PageHeader
        title="Épargne"
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            aria-label="Ajouter un projet"
          >
            <Plus className="size-5" />
          </Button>
        }
      />
      <div className="space-y-4 p-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">Total épargné</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-500">
              {formatCHF(totalSaved)}
            </p>
          </CardContent>
        </Card>

        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!loading && list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun projet d&apos;épargne. Créez-en un avec le bouton +.
          </p>
        )}

        {list.map((p) => {
          const goal = toNumber(p.goalAmount);
          const saved = toNumber(p.savedAmount);
          const pct = goal > 0 ? Math.min((saved / goal) * 100, 100) : 0;
          return (
            <Card key={p.id}>
              <CardContent className="space-y-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color ?? "#22c55e" }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      {p.targetDate && (
                        <p className="text-xs text-muted-foreground">
                          Objectif : {formatDate(p.targetDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setEditing(p);
                        setFormOpen(true);
                      }}
                      aria-label="Modifier"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-red-500"
                      onClick={() => remove(p.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Progress value={pct} />
                  <p className="text-xs text-muted-foreground">
                    {formatCHF(saved)} / {formatCHF(goal)} ({pct.toFixed(0)}%)
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setContributing(p)}
                >
                  <PiggyBank className="mr-2 size-4" /> Ajouter un versement
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SavingsProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editing} />
      <SavingsContributionDialog
        project={contributing}
        onOpenChange={(o) => !o && setContributing(null)}
      />
    </>
  );
}
