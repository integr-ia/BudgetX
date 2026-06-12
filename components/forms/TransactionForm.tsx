"use client";

import { useTransition } from "react";
import type { Category, Transaction } from "@/db/schema";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/actions/transaction-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { todayISO } from "@/utils/dates";

export function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: Category[];
  transaction?: Transaction;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (transaction) await updateTransaction(transaction.id, fd);
      else await createTransaction(fd);
      onDone();
    });
  }

  const defaultType = transaction?.type ?? "expense";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tx-type">Type</Label>
          <Select id="tx-type" name="type" defaultValue={defaultType} required>
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tx-amount">Montant (CHF)</Label>
          <Input
            id="tx-amount"
            name="amount"
            type="number"
            step="0.05"
            min="0"
            inputMode="decimal"
            defaultValue={transaction?.amount ?? ""}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-category">Catégorie</Label>
        <Select
          id="tx-category"
          name="categoryId"
          defaultValue={transaction?.categoryId ?? ""}
          required
        >
          <option value="" disabled>
            Choisir…
          </option>
          <optgroup label="Dépenses">
            {categories
              .filter((c) => c.type === "expense")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
          <optgroup label="Revenus">
            {categories
              .filter((c) => c.type === "income")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="tx-date">Date</Label>
          <Input
            id="tx-date"
            name="date"
            type="date"
            className="min-w-0 appearance-none"
            defaultValue={transaction?.date ?? todayISO()}
            required
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="tx-recurrence">Récurrence</Label>
          <Select
            id="tx-recurrence"
            name="recurrence"
            defaultValue={transaction?.recurrence ?? "none"}
          >
            <option value="none">Unique</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuel</option>
            <option value="yearly">Annuel</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tx-note">Note (optionnel)</Label>
        <Textarea
          id="tx-note"
          name="note"
          defaultValue={transaction?.note ?? ""}
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Enregistrement…" : transaction ? "Modifier" : "Ajouter"}
      </Button>
    </form>
  );
}
