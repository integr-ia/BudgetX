"use client";

import { useState, useTransition } from "react";
import { Banknote, Pencil, Plus, Trash2 } from "lucide-react";
import type {
  Investment,
  InvestmentCategory,
  InvestmentWithdrawal,
} from "@/db/schema";
import {
  createInvestment,
  updateInvestment,
  deleteInvestment,
  divestInvestment,
  createInvestmentCategory,
} from "@/lib/actions/investment-actions";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate, todayISO } from "@/utils/dates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Row = { investment: Investment; category: InvestmentCategory };

export function InvestmentsClient({
  rows,
  categories,
  withdrawals,
}: {
  rows: Row[];
  categories: InvestmentCategory[];
  withdrawals: InvestmentWithdrawal[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [divesting, setDivesting] = useState<Investment | null>(null);
  const [pending, startTransition] = useTransition();

  const totalInvested = rows.reduce(
    (s, r) => s + toNumber(r.investment.amountInvested),
    0
  );
  const totalCurrent = rows.reduce(
    (s, r) =>
      s +
      toNumber(r.investment.currentValue ?? r.investment.amountInvested),
    0
  );
  const gain = totalCurrent - totalInvested;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Valeur du portefeuille</p>
          <p className="text-2xl font-bold">{formatCHF(totalCurrent)}</p>
          <p className="text-xs text-muted-foreground">
            Investi : {formatCHF(totalInvested)} ·{" "}
            <span className={gain >= 0 ? "text-primary" : "text-destructive"}>
              {gain >= 0 ? "+" : ""}
              {formatCHF(gain)}
            </span>
          </p>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={() => setFormOpen(true)}>
        <Plus /> Ajouter un investissement
      </Button>

      {rows.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun investissement enregistré.
        </p>
      )}

      {rows.map(({ investment: inv, category }) => {
        const invested = toNumber(inv.amountInvested);
        const current = inv.currentValue ? toNumber(inv.currentValue) : null;
        const delta = current !== null ? current - invested : null;
        const invWithdrawals = withdrawals.filter(
          (w) => w.investmentId === inv.id
        );
        return (
          <Card key={inv.id}>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {inv.assetName}
                  <Badge
                    variant="secondary"
                    className="text-[10px]"
                  >
                    {category.name}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(inv.investmentDate)} · investi {formatCHF(invested)}
                </p>
                {inv.note && (
                  <p className="truncate text-xs text-muted-foreground">{inv.note}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCHF(current ?? invested)}
                </p>
                {delta !== null && (
                  <p
                    className={`text-xs ${delta >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {formatCHF(delta)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Modifier"
                  onClick={() => setEditing(inv)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Désinvestir"
                  onClick={() => setDivesting(inv)}
                >
                  <Banknote className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  aria-label="Supprimer"
                  disabled={pending}
                  onClick={() => startTransition(() => deleteInvestment(inv.id))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
            {invWithdrawals.length > 0 && (
              <CardContent className="border-t pb-3 pt-2">
                <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
                  Retraits
                </p>
                {invWithdrawals.map((w) => (
                  <p
                    key={w.id}
                    className="flex justify-between text-xs text-muted-foreground"
                  >
                    <span>
                      {formatDate(w.date)}
                      {w.note ? ` · ${w.note}` : ""}
                    </span>
                    <span className="text-destructive">
                      −{formatCHF(toNumber(w.amount))}
                    </span>
                  </p>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      <Dialog
        open={formOpen || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setFormOpen(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent
          title={editing ? "Modifier l'investissement" : "Nouvel investissement"}
        >
          <InvestmentForm
            categories={categories}
            investment={editing ?? undefined}
            onDone={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!divesting}
        onOpenChange={(o) => {
          if (!o) setDivesting(null);
        }}
      >
        <DialogContent title="Désinvestir">
          {divesting && (
            <DivestForm
              investment={divesting}
              onDone={() => setDivesting(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DivestForm({
  investment,
  onDone,
}: {
  investment: Investment;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const current = toNumber(
    investment.currentValue ?? investment.amountInvested
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await divestInvestment(investment.id, fd);
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {investment.assetName} · valeur actuelle {formatCHF(current)}
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="d-amount">Montant à retirer (CHF)</Label>
        <Input
          id="d-amount"
          name="amount"
          type="number"
          step="0.05"
          min="0.05"
          max={current}
          inputMode="decimal"
          defaultValue={current}
          required
        />
        <p className="text-xs text-muted-foreground">
          Le retrait est enregistré dans l&apos;historique ; le montant investi
          est réduit proportionnellement.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="d-date">Date du retrait</Label>
        <Input
          id="d-date"
          name="date"
          type="date"
          defaultValue={todayISO()}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="d-note">Note (optionnel)</Label>
        <Textarea id="d-note" name="note" rows={2} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="addToTransactions"
          className="h-4 w-4 rounded border-input"
        />
        Ajouter aux transactions
      </label>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Retrait…" : "Désinvestir"}
      </Button>
    </form>
  );
}

function InvestmentForm({
  categories,
  investment,
  onDone,
}: {
  categories: InvestmentCategory[];
  investment?: Investment;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (investment) await updateInvestment(investment.id, fd);
      else await createInvestment(fd);
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="i-asset">Actif</Label>
        <Input
          id="i-asset"
          name="assetName"
          placeholder="ex. Bitcoin, VWRL…"
          defaultValue={investment?.assetName ?? ""}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="i-cat">Catégorie</Label>
        <Select
          id="i-cat"
          name="categoryId"
          defaultValue={investment?.categoryId ?? ""}
          required
        >
          <option value="" disabled>
            Choisir…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <button
          type="button"
          className="text-xs text-primary"
          onClick={() => {
            const name = prompt("Nom de la nouvelle catégorie :");
            if (name?.trim()) {
              const fd = new FormData();
              fd.set("name", name.trim());
              startTransition(() => createInvestmentCategory(fd));
            }
          }}
        >
          + Nouvelle catégorie
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="i-amount">Montant investi (CHF)</Label>
          <Input
            id="i-amount"
            name="amountInvested"
            type="number"
            step="0.05"
            min="0"
            inputMode="decimal"
            defaultValue={investment?.amountInvested ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="i-value">Valeur actuelle (CHF)</Label>
          <Input
            id="i-value"
            name="currentValue"
            type="number"
            step="0.05"
            min="0"
            inputMode="decimal"
            defaultValue={investment?.currentValue ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="i-date">Date</Label>
        <Input
          id="i-date"
          name="investmentDate"
          type="date"
          defaultValue={investment?.investmentDate ?? todayISO()}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="i-note">Note (optionnel)</Label>
        <Textarea id="i-note" name="note" defaultValue={investment?.note ?? ""} rows={2} />
      </div>
      {!investment && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="addToTransactions"
            className="h-4 w-4 rounded border-input"
          />
          Ajouter aux transactions
        </label>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Enregistrement…" : investment ? "Modifier" : "Ajouter"}
      </Button>
    </form>
  );
}
