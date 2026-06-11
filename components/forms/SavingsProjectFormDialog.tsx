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
import { PROJECT_COLORS } from "@/constants/categories";
import { cn } from "@/lib/utils";

export function SavingsProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: SavingsProject | null;
}) {
  const [name, setName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("0");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setGoalAmount(project ? String(project.goalAmount) : "");
      setSavedAmount(project ? String(project.savedAmount) : "0");
      setTargetDate(project?.targetDate ?? "");
      setColor(project?.color ?? PROJECT_COLORS[0]);
    }
  }, [open, project]);

  const valid = name.trim() !== "" && parseFloat(goalAmount) > 0;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const values = {
      name: name.trim(),
      goalAmount: String(parseFloat(goalAmount)),
      savedAmount: String(parseFloat(savedAmount) || 0),
      targetDate: targetDate || null,
      color,
      updatedAt: new Date(),
    };
    await mutate(async (db) => {
      if (project) {
        await db
          .update(schema.savingsProjects)
          .set(values)
          .where(eq(schema.savingsProjects.id, project.id));
      } else {
        await db.insert(schema.savingsProjects).values({ id: uid(), ...values });
      }
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Modifier le projet" : "Nouveau projet d'épargne"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sp-name">Nom du projet</Label>
            <Input
              id="sp-name"
              placeholder="ex : Vacances Grèce"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sp-goal">Objectif (CHF)</Label>
              <Input
                id="sp-goal"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.05"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-saved">Déjà épargné</Label>
              <Input
                id="sp-saved"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.05"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-date">Date cible (optionnelle)</Label>
            <Input
              id="sp-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "size-8 rounded-full border-2 transition-transform",
                    color === c ? "scale-110 border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Couleur ${c}`}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={save}>
            {project ? "Enregistrer" : "Créer le projet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
