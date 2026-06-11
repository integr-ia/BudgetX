"use client";

import { useMemo, useState } from "react";
import { desc, eq } from "drizzle-orm";
import { Download, Pencil, Settings2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionFormDialog } from "@/components/forms/TransactionFormDialog";
import { CategoryManagerDialog } from "@/components/forms/CategoryManagerDialog";
import { useDbQuery, mutate } from "@/hooks/useDbQuery";
import * as schema from "@/db/schema";
import type { Transaction } from "@/db/schema";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate, todayISO } from "@/utils/dates";
import { exportCSV, exportJSON } from "@/utils/export";

export default function TransactionsPage() {
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);

  const { data, loading } = useDbQuery(async (db) => {
    const txs = await db
      .select()
      .from(schema.transactions)
      .orderBy(desc(schema.transactions.date), desc(schema.transactions.createdAt));
    const cats = await db.select().from(schema.categories);
    return { txs, cats };
  });

  const catById = useMemo(
    () => new Map((data?.cats ?? []).map((c) => [c.id, c])),
    [data]
  );

  const filtered = (data?.txs ?? []).filter(
    (t) => filter === "all" || t.type === filter
  );
  const today = todayISO();

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette transaction ?")) return;
    await mutate((db) =>
      db.delete(schema.transactions).where(eq(schema.transactions.id, id))
    );
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        action={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCatManagerOpen(true)}
              aria-label="Gérer les catégories"
            >
              <Settings2 className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => exportCSV()}
              aria-label="Exporter (CSV)"
            >
              <Download className="size-5" />
            </Button>
          </>
        }
      />
      <div className="space-y-4 p-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Tout</TabsTrigger>
            <TabsTrigger value="expense" className="flex-1">Dépenses</TabsTrigger>
            <TabsTrigger value="income" className="flex-1">Revenus</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucune transaction. Utilisez le bouton + pour en ajouter une.
          </p>
        )}

        <div className="space-y-2">
          {filtered.map((t) => {
            const cat = catById.get(t.categoryId);
            const future = t.date > today;
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cat?.color ?? "#737373" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {cat?.name ?? "Sans catégorie"}
                    {t.isRecurring && (
                      <span className="ml-1 text-xs text-muted-foreground">↻</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(t.date)}
                    {future && (
                      <Badge variant="outline" className="ml-2 px-1 py-0 text-[10px]">
                        Planifiée
                      </Badge>
                    )}
                    {t.note ? ` · ${t.note}` : ""}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    t.type === "expense" ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {t.type === "expense" ? "−" : "+"}
                  {formatCHF(toNumber(t.amount))}
                </p>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setEditing(t)}
                    aria-label="Modifier"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-red-500"
                    onClick={() => remove(t.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="outline" className="w-full" onClick={() => exportJSON()}>
          <Download className="mr-2 size-4" /> Exporter toutes les données (JSON)
        </Button>
      </div>

      <TransactionFormDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        transaction={editing}
      />
      <CategoryManagerDialog open={catManagerOpen} onOpenChange={setCatManagerOpen} />
    </>
  );
}
