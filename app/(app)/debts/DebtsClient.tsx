"use client";

import { useState, useTransition } from "react";
import { addMonths } from "date-fns";
import { Gavel, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import type { Debt } from "@/db/schema";
import {
  createDebt,
  updateDebt,
  deleteDebt,
  addDebtPayment,
} from "@/lib/actions/debt-actions";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate, todayISO } from "@/utils/dates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const statusLabels: Record<string, string> = {
  active: "En cours",
  paid: "Soldée",
  paused: "En pause",
};

export function DebtsClient({
  debts,
  totals,
}: {
  debts: Debt[];
  totals: { totalRemaining: number; pursuitsRemaining: number };
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total restant dû</p>
            <p className="font-semibold">{formatCHF(totals.totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Gavel className="size-3.5" /> Poursuites
            </p>
            <p className="font-semibold">
              {formatCHF(totals.pursuitsRemaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Button className="w-full" onClick={() => setFormOpen(true)}>
        <Plus /> Ajouter une dette
      </Button>

      {debts.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucune dette enregistrée.
        </p>
      )}

      {debts.map((d) => {
        const total = toNumber(d.totalAmount);
        const paid = toNumber(d.paidAmount);
        const remaining = Math.max(0, total - paid);
        const monthly = d.monthlyPayment ? toNumber(d.monthlyPayment) : null;
        // Règles métier n°4 et n°5
        const remainingMonths =
          monthly && monthly > 0 ? Math.ceil(remaining / monthly) : null;
        const estimatedEnd =
          remainingMonths !== null
            ? addMonths(new Date(), remainingMonths)
            : null;
        const pct = total > 0 ? (paid / total) * 100 : 0;

        return (
          <Card key={d.id}>
            <CardContent className="space-y-2 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    {d.type === "pursuit" && (
                      <Gavel className="size-4 text-red-400" />
                    )}
                    {d.name}
                  </p>
                  {d.creditor && (
                    <p className="text-xs text-muted-foreground">{d.creditor}</p>
                  )}
                  {d.type === "pursuit" && d.pursuitNumber && (
                    <p className="text-xs text-muted-foreground">
                      Réquisition n° {d.pursuitNumber}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    d.status === "paid"
                      ? "default"
                      : d.status === "paused"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {statusLabels[d.status] ?? d.status}
                </Badge>
              </div>

              <Progress value={pct} />
              <p className="text-xs text-muted-foreground">
                {formatCHF(paid)} remboursés sur {formatCHF(total)} — reste{" "}
                {formatCHF(remaining)}
              </p>
              {monthly !== null && (
                <p className="text-xs text-muted-foreground">
                  Mensualité {formatCHF(monthly)} · {remainingMonths} mensualités
                  restantes
                  {estimatedEnd && <> · fin estimée {formatDate(estimatedEnd)}</>}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                {d.status === "active" && (
                  <Button size="sm" onClick={() => setPaying(d)}>
                    <Wallet /> Rembourser
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(d)}
                >
                  <Pencil /> Modifier
                </Button>
                <DeleteDebtButton id={d.id} />
              </div>
            </CardContent>
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
        <DialogContent title={editing ? "Modifier la dette" : "Nouvelle dette"}>
          <DebtForm
            debt={editing ?? undefined}
            onDone={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent title={`Remboursement — ${paying?.name ?? ""}`}>
          {paying && (
            <PaymentForm debt={paying} onDone={() => setPaying(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteDebtButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive"
      disabled={pending}
      onClick={() => {
        if (confirm("Supprimer cette dette et son historique ?"))
          startTransition(() => deleteDebt(id));
      }}
    >
      <Trash2 />
    </Button>
  );
}

function DebtForm({ debt, onDone }: { debt?: Debt; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState(debt?.type ?? "debt");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      if (debt) await updateDebt(debt.id, fd);
      else await createDebt(fd);
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="d-type">Type</Label>
          <Select
            id="d-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="debt">Dette</option>
            <option value="pursuit">Poursuite</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-status">Statut</Label>
          <Select id="d-status" name="status" defaultValue={debt?.status ?? "active"}>
            <option value="active">En cours</option>
            <option value="paid">Soldée</option>
            <option value="paused">En pause</option>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="d-name">Nom</Label>
        <Input id="d-name" name="name" defaultValue={debt?.name ?? ""} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="d-creditor">Créancier (optionnel)</Label>
        <Input id="d-creditor" name="creditor" defaultValue={debt?.creditor ?? ""} />
      </div>
      {type === "pursuit" && (
        <div className="space-y-1.5">
          <Label htmlFor="d-pursuit">N° de réquisition (optionnel)</Label>
          <Input
            id="d-pursuit"
            name="pursuitNumber"
            defaultValue={debt?.pursuitNumber ?? ""}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="d-total">Montant total dû (CHF)</Label>
          <Input
            id="d-total"
            name="totalAmount"
            type="number"
            step="0.05"
            min="0"
            inputMode="decimal"
            defaultValue={debt?.totalAmount ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-paid">Déjà remboursé (CHF)</Label>
          <Input
            id="d-paid"
            name="paidAmount"
            type="number"
            step="0.05"
            min="0"
            inputMode="decimal"
            defaultValue={debt?.paidAmount ?? "0"}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="d-monthly">Mensualité (optionnel)</Label>
          <Input
            id="d-monthly"
            name="monthlyPayment"
            type="number"
            step="0.05"
            min="0"
            inputMode="decimal"
            defaultValue={debt?.monthlyPayment ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-start">Date de début</Label>
          <Input
            id="d-start"
            name="startDate"
            type="date"
            defaultValue={debt?.startDate ?? todayISO()}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="d-note">Notes (optionnel)</Label>
        <Textarea id="d-note" name="note" defaultValue={debt?.note ?? ""} rows={2} />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Enregistrement…" : debt ? "Modifier" : "Ajouter"}
      </Button>
    </form>
  );
}

function PaymentForm({ debt, onDone }: { debt: Debt; onDone: () => void }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("debtId", debt.id);
    startTransition(async () => {
      await addDebtPayment(fd);
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="p-amount">Montant (CHF)</Label>
          <Input
            id="p-amount"
            name="amount"
            type="number"
            step="0.05"
            min="0.05"
            inputMode="decimal"
            defaultValue={debt.monthlyPayment ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-date">Date</Label>
          <Input id="p-date" name="date" type="date" defaultValue={todayISO()} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-note">Note (optionnel)</Label>
        <Textarea id="p-note" name="note" rows={2} />
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
        {pending ? "Enregistrement…" : "Enregistrer le remboursement"}
      </Button>
    </form>
  );
}
