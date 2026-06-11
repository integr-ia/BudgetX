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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDbQuery, mutate } from "@/hooks/useDbQuery";
import { uid } from "@/db/client";
import * as schema from "@/db/schema";
import type { Transaction } from "@/db/schema";
import { todayISO } from "@/utils/dates";

const RECURRENCES = [
  { value: "none", label: "Unique" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "monthly", label: "Mensuel" },
  { value: "yearly", label: "Annuel" },
];

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
}) {
  const { data: categories } = useDbQuery((db) =>
    db.select().from(schema.categories)
  );

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType((transaction?.type as "expense" | "income") ?? "expense");
      setAmount(transaction ? String(transaction.amount) : "");
      setCategoryId(transaction?.categoryId ?? "");
      setDate(transaction?.date ?? todayISO());
      setNote(transaction?.note ?? "");
      setRecurrence(transaction?.recurrence ?? "none");
    }
  }, [open, transaction]);

  const filteredCategories = (categories ?? []).filter((c) => c.type === type);
  const valid = parseFloat(amount) > 0 && categoryId !== "" && date !== "";

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const values = {
      type,
      amount: String(parseFloat(amount)),
      categoryId,
      date,
      note: note.trim() || null,
      isRecurring: recurrence !== "none",
      recurrence: recurrence === "none" ? null : recurrence,
      updatedAt: new Date(),
    };
    await mutate(async (db) => {
      if (transaction) {
        await db
          .update(schema.transactions)
          .set(values)
          .where(eq(schema.transactions.id, transaction.id));
      } else {
        await db.insert(schema.transactions).values({ id: uid(), ...values });
      }
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Modifier la transaction" : "Nouvelle transaction"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs
            value={type}
            onValueChange={(v) => {
              setType(v as "expense" | "income");
              setCategoryId("");
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">
                Dépense
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1">
                Revenu
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="tx-amount">Montant (CHF)</Label>
            <Input
              id="tx-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.05"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-date">Date</Label>
            <Input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Récurrence</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v ?? "none")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-note">Note (optionnelle)</Label>
            <Textarea
              id="tx-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={!valid || saving} onClick={save}>
            {transaction ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
