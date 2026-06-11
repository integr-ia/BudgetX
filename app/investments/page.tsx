"use client";

import { useMemo, useState } from "react";
import { eq, desc } from "drizzle-orm";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InvestmentFormDialog } from "@/components/forms/InvestmentFormDialog";
import { useDbQuery, mutate } from "@/hooks/useDbQuery";
import * as schema from "@/db/schema";
import type { Investment } from "@/db/schema";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate } from "@/utils/dates";

export default function InvestmentsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const { data, loading } = useDbQuery(async (db) => {
    const investments = await db
      .select()
      .from(schema.investments)
      .orderBy(desc(schema.investments.investmentDate));
    const cats = await db.select().from(schema.investmentCategories);
    return { investments, cats };
  });

  const catById = useMemo(
    () => new Map((data?.cats ?? []).map((c) => [c.id, c])),
    [data]
  );

  const investments = data?.investments ?? [];
  const totalInvested = investments.reduce((s, i) => s + toNumber(i.amountInvested), 0);
  const totalCurrent = investments.reduce(
    (s, i) => s + (i.currentValue !== null ? toNumber(i.currentValue) : toNumber(i.amountInvested)),
    0
  );
  const gain = totalCurrent - totalInvested;

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet investissement ?")) return;
    await mutate((db) => db.delete(schema.investments).where(eq(schema.investments.id, id)));
  };

  return (
    <>
      <PageHeader
        title="Investissements"
        action={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            aria-label="Ajouter un investissement"
          >
            <Plus className="size-5" />
          </Button>
        }
      />
      <div className="space-y-4 p-4">
        <Card>
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground">Valeur actuelle estimée</p>
            <p className="text-2xl font-bold tabular-nums">{formatCHF(totalCurrent)}</p>
            <p className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {gain >= 0 ? "+" : ""}
              {formatCHF(gain)} vs {formatCHF(totalInvested)} investis
            </p>
          </CardContent>
        </Card>

        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!loading && investments.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun investissement enregistré.
          </p>
        )}

        {investments.map((inv) => {
          const cat = catById.get(inv.categoryId);
          const invested = toNumber(inv.amountInvested);
          const current = inv.currentValue !== null ? toNumber(inv.currentValue) : null;
          const delta = current !== null ? current - invested : null;
          return (
            <Card key={inv.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cat?.color ?? "#737373" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.assetName}</p>
                  <p className="text-xs text-muted-foreground">
                    {cat?.name ?? "—"} · {formatDate(inv.investmentDate)}
                    {inv.note ? ` · ${inv.note}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCHF(current ?? invested)}
                  </p>
                  {delta !== null ? (
                    <Badge
                      variant="outline"
                      className={delta >= 0 ? "text-emerald-500" : "text-red-500"}
                    >
                      {delta >= 0 ? "+" : ""}
                      {formatCHF(delta)}
                    </Badge>
                  ) : (
                    <p className="text-xs text-muted-foreground">investi</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => {
                      setEditing(inv);
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
                    onClick={() => remove(inv.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <InvestmentFormDialog open={formOpen} onOpenChange={setFormOpen} investment={editing} />
    </>
  );
}
