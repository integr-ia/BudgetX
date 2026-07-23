"use client";

import { useMemo, useState, useTransition } from "react";
import { addMonths, addWeeks, addYears, parseISO } from "date-fns";
import {
  CalendarClock,
  List,
  Pencil,
  Receipt,
  Repeat,
  Settings2,
  Trash2,
} from "lucide-react";
import type { Category, Transaction } from "@/db/schema";
import {
  deleteTransaction,
  createCategory,
  renameCategory,
  deleteCategory,
} from "@/lib/actions/transaction-actions";
import { formatCHF, toNumber } from "@/utils/currency";
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

const RECURRENCE_STEP: Record<string, (d: Date) => Date> = {
  weekly: (d) => addWeeks(d, 1),
  monthly: (d) => addMonths(d, 1),
  yearly: (d) => addYears(d, 1),
};

// Équivalent mensuel approximatif pour comparer des récurrences différentes.
const MONTHLY_FACTOR: Record<string, number> = {
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

export function TransactionsClient({
  rows,
  categories,
  initialBalance,
}: {
  rows: Row[];
  categories: Category[];
  initialBalance: number;
}) {
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [view, setView] = useState<"list" | "ledger" | "subscriptions">("list");
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

  // Décompte : solde courant calculé chronologiquement, puis affiché du plus récent au plus ancien.
  const ledger = useMemo(() => {
    const ascending = [...rows].sort((a, b) => {
      if (a.transaction.date !== b.transaction.date)
        return a.transaction.date < b.transaction.date ? -1 : 1;
      return a.transaction.createdAt < b.transaction.createdAt ? -1 : 1;
    });
    let running = initialBalance;
    const withBalance = ascending.map((row) => {
      const amount = toNumber(row.transaction.amount);
      running += row.transaction.type === "income" ? amount : -amount;
      return { ...row, balance: running };
    });
    return withBalance.reverse();
  }, [rows, initialBalance]);

  // Une carte par série récurrente active : la dernière occurrence connue,
  // avec sa prochaine échéance calculée à partir de sa fréquence.
  const subscriptions = useMemo(() => {
    const latestBySeries = new Map<string, Row>();
    for (const row of rows) {
      const { transaction: t } = row;
      if (!t.isRecurring || !t.recurrence) continue;
      const key = t.seriesId ?? t.id;
      const current = latestBySeries.get(key);
      if (!current || t.date > current.transaction.date) {
        latestBySeries.set(key, row);
      }
    }
    return Array.from(latestBySeries.values())
      .map((row) => {
        const t = row.transaction;
        const recurrence = t.recurrence as string;
        const step = RECURRENCE_STEP[recurrence];
        const nextDue = step ? step(parseISO(t.date)) : null;
        return { ...row, nextDue };
      })
      .sort((a, b) => {
        if (!a.nextDue || !b.nextDue) return 0;
        return a.nextDue.getTime() - b.nextDue.getTime();
      });
  }, [rows]);

  const monthlySubscriptionTotal = useMemo(
    () =>
      subscriptions
        .filter((s) => s.transaction.type === "expense")
        .reduce((sum, s) => {
          const factor = MONTHLY_FACTOR[s.transaction.recurrence as string] ?? 0;
          return sum + toNumber(s.transaction.amount) * factor;
        }, 0),
    [subscriptions]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex overflow-x-auto rounded-lg border p-0.5">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setView("list")}
          >
            <List className="size-3.5" /> Liste
          </Button>
          <Button
            variant={view === "ledger" ? "default" : "ghost"}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setView("ledger")}
          >
            <Receipt className="size-3.5" /> Décompte
          </Button>
          <Button
            variant={view === "subscriptions" ? "default" : "ghost"}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setView("subscriptions")}
          >
            <Repeat className="size-3.5" /> Abonnements
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto shrink-0"
          aria-label="Gérer les catégories"
          onClick={() => setCatManagerOpen(true)}
        >
          <Settings2 className="size-5" />
        </Button>
      </div>

      {view === "list" ? (
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
        </div>
      ) : view === "ledger" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Solde de départ : {formatCHF(initialBalance)}
          </p>

          {ledger.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune transaction. Utilisez le bouton + pour en ajouter.
            </p>
          )}

          {ledger.map(({ transaction: t, category, balance }) => {
            const isFuture = t.date > today;
            return (
              <Card key={t.id} className={isFuture ? "opacity-70" : undefined}>
                <CardContent className="flex items-center gap-3 py-3">
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
                    </p>
                    {t.note && (
                      <p className="truncate text-xs text-muted-foreground">{t.note}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        t.type === "income" ? "text-primary" : "text-destructive"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {formatCHF(t.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solde : {formatCHF(balance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <p className="text-sm text-muted-foreground">
                Coût mensuel total des abonnements
              </p>
              <p className="text-sm font-semibold text-destructive">
                {formatCHF(monthlySubscriptionTotal)}
              </p>
            </CardContent>
          </Card>

          {subscriptions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun abonnement. Activez une récurrence sur une transaction pour
              la voir apparaître ici.
            </p>
          )}

          {subscriptions.map(({ transaction: t, category, nextDue }) => (
            <Card key={t.seriesId ?? t.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color ?? "#64748b" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {t.note || category.name}
                  </p>
                  <p className="flex flex-wrap items-center gap-1.5 gap-y-1 text-xs text-muted-foreground">
                    <Badge variant="secondary">
                      {recurrenceLabels[t.recurrence ?? ""] ?? t.recurrence}
                    </Badge>
                    {nextDue && <span>Prochaine échéance : {formatDate(nextDue)}</span>}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    t.type === "income" ? "text-primary" : "text-destructive"
                  }`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatCHF(t.amount)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
