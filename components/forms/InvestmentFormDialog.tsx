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
import { useDbQuery, mutate } from "@/hooks/useDbQuery";
import { uid } from "@/db/client";
import * as schema from "@/db/schema";
import type { Investment } from "@/db/schema";
import { todayISO } from "@/utils/dates";

export function InvestmentFormDialog({
  open,
  onOpenChange,
  investment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: Investment | null;
}) {
  const { data: categories } = useDbQuery((db) =>
    db.select().from(schema.investmentCategories)
  );

  const [categoryId, setCategoryId] = useState("");
  const [assetName, setAssetName] = useState("");
  const [amountInvested, setAmountInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategoryId(investment?.categoryId ?? "");
      setAssetName(investment?.assetName ?? "");
      setAmountInvested(investment ? String(investment.amountInvested) : "");
      setCurrentValue(
        investment?.currentValue !== null && investment?.currentValue !== undefined
          ? String(investment.currentValue)
          : ""
      );
      setDate(investment?.investmentDate ?? todayISO());
      setNote(investment?.note ?? "");
      setNewCatName("");
    }
  }, [open, investment]);

  const valid =
    assetName.trim() !== "" &&
    parseFloat(amountInvested) > 0 &&
    (categoryId !== "" || newCatName.trim() !== "") &&
    date !== "";

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    await mutate(async (db) => {
      let catId = categoryId;
      if (catId === "" && newCatName.trim()) {
        catId = uid();
        await db.insert(schema.investmentCategories).values({
          id: catId,
          name: newCatName.trim(),
          isDefault: false,
          color: "#737373",
        });
      }
      const values = {
        categoryId: catId,
        assetName: assetName.trim(),
        amountInvested: String(parseFloat(amountInvested)),
        currentValue: currentValue !== "" ? String(parseFloat(currentValue)) : null,
        investmentDate: date,
        note: note.trim() || null,
        updatedAt: new Date(),
      };
      if (investment) {
        await db
          .update(schema.investments)
          .set(values)
          .where(eq(schema.investments.id, investment.id));
      } else {
        await db.insert(schema.investments).values({ id: uid(), ...values });
      }
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {investment ? "Modifier l'investissement" : "Nouvel investissement"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoryId === "" && (
              <Input
                placeholder="…ou créer une nouvelle catégorie"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-asset">Actif / Nom</Label>
            <Input
              id="inv-asset"
              placeholder="ex : Bitcoin, S&P 500 ETF"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Investi (CHF)</Label>
              <Input
                id="inv-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.05"
                value={amountInvested}
                onChange={(e) => setAmountInvested(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-current">Valeur actuelle</Label>
              <Input
                id="inv-current"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.05"
                placeholder="optionnel"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-date">Date d&apos;investissement</Label>
            <Input
              id="inv-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-note">Note (optionnelle)</Label>
            <Textarea id="inv-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={save}>
            {investment ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
