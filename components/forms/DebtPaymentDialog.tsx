"use client";

import { useEffect, useState } from "react";
import { eq } from "drizzle-orm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mutate } from "@/hooks/useDbQuery";
import { uid } from "@/db/client";
import * as schema from "@/db/schema";
import type { Debt } from "@/db/schema";
import { todayISO } from "@/utils/dates";
import { toNumber, formatCHF } from "@/utils/currency";

export function DebtPaymentDialog({
  debt,
  onOpenChange,
}: {
  debt: Debt | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (debt) {
      setAmount(String(toNumber(debt.monthlyPayment)));
      setDate(todayISO());
      setNote("");
    }
  }, [debt]);

  if (!debt) return <Dialog open={false} onOpenChange={onOpenChange} />;

  const remaining = Math.max(toNumber(debt.totalAmount) - toNumber(debt.paidAmount), 0);
  const valid = parseFloat(amount) > 0 && date !== "";

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const amt = parseFloat(amount);
    const newPaid = toNumber(debt.paidAmount) + amt;
    const total = toNumber(debt.totalAmount);
    await mutate(async (db) => {
      await db.insert(schema.debtPayments).values({
        id: uid(),
        debtId: debt.id,
        amount: String(amt),
        date,
        note: note.trim() || null,
      });
      await db
        .update(schema.debts)
        .set({
          paidAmount: String(newPaid),
          status: newPaid >= total ? "paid" : debt.status,
          updatedAt: new Date(),
        })
        .where(eq(schema.debts.id, debt.id));
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Remboursement — {debt.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Restant dû : {formatCHF(remaining)}
          </p>
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Montant (CHF)</Label>
            <Input
              id="pay-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.05"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-date">Date</Label>
            <Input
              id="pay-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-note">Note (optionnelle)</Label>
            <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={save}>
            Enregistrer le remboursement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
