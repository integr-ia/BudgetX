"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarClock, Pencil, Settings2, Trash2 } from "lucide-react";
import type { Category, Transaction } from "@/db/schema";
import {
  deleteTransaction,
  createCategory,
  renameCategory,
  deleteCategory,
} from "@/lib/actions/transaction-actions";
import { formatCHF } from "@/utils/currency";
import { formatDate, todayISO } from "@/utils/dates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";

type Row = { transaction: Transaction; category: Category };

const recurrenceLabels: Record<string, string> = {
  weekly: "Hebdo",
  monthly: "Mensuel",
  yearly: "Annuel",
};

export function TransactionsClient({
  rows,
  categories,
}: {
  rows: Row[];
  categories: Category[];
}) {
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      filter === "all"
        ? rows
        : rows.filter((r) => r.transaction.type === filter),
    [rows, filter]
  );
  const today = todayISO();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(
          [
            ["all", "Tout"],
            ["expense", "Dépenses"],
            ["income", "Revenus"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "secondary"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          aria-label="Gérer les catégories"
          onClick={() => setCatManagerOpen(true)}
        >
          <Settings2 className="size-5" />
        </Button>
      </div>

      {filtered.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune transaction. Utilisez le bouton + pour en ajouter.
        </p>
      )}

      {filtered.map(({ transaction: t, category }) => {
        const isFuture = t.date > today;
        return (
          <Card key={t.id} className={isFuture ? "opacity-70" : undefined}>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color ?? "#64748b" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category.name}</p>
                <p className="flex flex-wrap items-center gap-1.5 gap-y-1 text-xs text-muted-foreground">
                  {formatDate(t.date)}
                  {isFuture && (
                    <Badge variant="outline" className="gap-1">
                      <CalendarClock className="size-3" /> Planifiée
                    </Badge>
                  )}
                  {t.recurrence && (
                    <Badge variant="secondary">
                      {recurrenceLabels[t.recurrence] ?? t.recurrence}
                    </Badge>
                  )}
                </p>
                {t.note && (
                  <p className="truncate text-xs text-muted-foreground">{t.note}</p>
                )}
              </div>
              <span
                className={`shrink-0 text-sm font-semibold ${
                  t.type === "income" ? "text-primary" : "text-destructive"
                }`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatCHF(t.amount)}
              </span>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Modifier"
                  onClick={() => setEditing(t)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  aria-label="Supprimer"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => deleteTransaction(t.id))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title="Modifier la transaction">
          {editing && (
            <TransactionForm
              categories={categories}
              transaction={editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={catManagerOpen} onOpenChange={setCatManagerOpen}>
        <DialogContent title="Catégories">
          <CategoryManager categories={categories} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryManager({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      await createCategory(fd);
      form.reset();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nom</Label>
            <Input id="cat-name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-type">Type</Label>
            <Select id="cat-type" name="type" defaultValue="expense">
              <option value="expense">Dépense</option>
              <option value="income">Revenu</option>
            </Select>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={pending} className="w-full">
          Créer la catégorie
        </Button>
      </form>

      <div className="max-h-72 space-y-1 overflow-y-auto">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: c.color ?? "#64748b" }}
              />
              {c.name}
              {c.isDefault && (
                <Badge variant="secondary" className="text-[10px]">
                  défaut
                </Badge>
              )}
            </span>
            <span className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label="Renommer"
                onClick={() => {
                  const name = prompt("Nouveau nom :", c.name);
                  if (name?.trim())
                    startTransition(() => renameCategory(c.id, name.trim()));
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              {!c.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  aria-label="Supprimer"
                  onClick={() => startTransition(() => deleteCategory(c.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
