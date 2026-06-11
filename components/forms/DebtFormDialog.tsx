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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mutate } from "@/hooks/useDbQuery";
import { uid } from "@/db/client";
import * as schema from "@/db/schema";
import type { Debt } from "@/db/schema";
import { todayISO } from "@/utils/dates";

export function DebtFormDialog({
  open,
  onOpenChange,
  debt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: Debt | null;
}) {
  const [type, setType] = useState<"debt" | "pursuit">("debt");
  const [name, setName] = useState("");
  const [creditor, setCreditor] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [pursuitNumber, setPursuitNumber] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType((debt?.type as "debt" | "pursuit") ?? "debt");
      setName(debt?.name ?? "");
      setCreditor(debt?.creditor ?? "");
      setTotalAmount(debt ? String(debt.totalAmount) : "");
      setPaidAmount(debt ? String(debt.paidAmount) : "0");
      setMonthlyPayment(debt ? String(debt.monthlyPayment) : "");
      setStartDate(debt?.startDate ?? todayISO());
      setPursuitNumber(debt?.pursuitNumber ?? "");
      setNote(debt?.note ?? "");
    }
  }, [open, debt]);

  const valid =
    name.trim() !== "" &&
    parseFloat(totalAmount) > 0 &&
    parseFloat(monthlyPayment) > 0 &&
    startDate !== "";

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const total = parseFloat(totalAmount);
    const paid = parseFloat(paidAmount) || 0;
    const values = {
      name: name.trim(),
      creditor: creditor.trim() || null,
      type,
      totalAmount: String(total),
      paidAmount: String(paid),
      monthlyPayment: String(parseFloat(monthlyPayment)),
      startDate,
      status: paid >= total ? "paid" : debt?.status === "paused" ? "paused" : "active",
      pursuitNumber: type === "pursuit" ? pursuitNumber.trim() || null : null,
      note: note.trim() || null,
      updatedAt: new Date(),
    };
    await mutate(async (db) => {
      if (debt) {
        await db.update(schema.debts).set(values).where(eq(schema.debts.id, debt.id));
      } else {
        await db.insert(schema.debts).values({ id: uid(), ...values });
      }
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{debt ? "Modifier la dette" : "Nouvelle dette"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
            <TabsList className="w-full">
              <TabsTrigger value="debt" className="flex-1">Dette</TabsTrigger>
              <TabsTrigger value="pursuit" className="flex-1">Poursuite</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="debt-name">Nom</Label>
            <Input id="debt-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-creditor">Créancier (optionnel)</Label>
            <Input id="debt-creditor" value={creditor} onChange={(e) => setCreditor(e.target.value)} />
          </div>
          {type === "pursuit" && (
            <div className="space-y-2">
              <Label htmlFor="debt-pursuit">N° de réquisition (optionnel)</Label>
              <Input
                id="debt-pursuit"
                value={pursuitNumber}
                onChange={(e) => setPursuitNumber(e.target.value)}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-total">Total dû (CHF)</Label>
              <Input
                id="debt-total"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.05"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-paid">Déjà remboursé</Label>
              <Input
                id="debt-paid"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.05"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="debt-monthly">Mensualité (CHF)</Label>
              <Input
                id="debt-monthly"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.05"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debt-start">Début du plan</Label>
              <Input
                id="debt-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-note">Notes</Label>
            <Textarea id="debt-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={save}>
            {debt ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
