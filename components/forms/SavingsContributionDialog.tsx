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
import type { SavingsProject } from "@/db/schema";
import { todayISO } from "@/utils/dates";
import { toNumber, formatCHF } from "@/utils/currency";

export function SavingsContributionDialog({
  project,
  onOpenChange,
}: {
  project: SavingsProject | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setAmount("");
      setDate(todayISO());
      setNote("");
    }
  }, [project]);

  if (!project) return <Dialog open={false} onOpenChange={onOpenChange} />;

  const valid = parseFloat(amount) > 0 && date !== "";
  const remaining = Math.max(
    toNumber(project.goalAmount) - toNumber(project.savedAmount),
    0
  );

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const amt = parseFloat(amount);
    await mutate(async (db) => {
      await db.insert(schema.savingsContributions).values({
        id: uid(),
        projectId: project.id,
        amount: String(amt),
        date,
        note: note.trim() || null,
      });
      await db
        .update(schema.savingsProjects)
        .set({
          savedAmount: String(toNumber(project.savedAmount) + amt),
          updatedAt: new Date(),
        })
        .where(eq(schema.savingsProjects.id, project.id));
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Versement — {project.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Restant pour l&apos;objectif : {formatCHF(remaining)}
          </p>
          <div className="space-y-2">
            <Label htmlFor="sc-amount">Montant (CHF)</Label>
            <Input
              id="sc-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.05"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sc-date">Date</Label>
            <Input id="sc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sc-note">Note (optionnelle)</Label>
            <Input id="sc-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={save}>
            Enregistrer le versement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
