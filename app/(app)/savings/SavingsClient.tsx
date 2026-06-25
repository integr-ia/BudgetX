"use client";

import { useState, useTransition } from "react";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";
import type { SavingsProject } from "@/db/schema";
import {
  createSavingsProject,
  updateSavingsProject,
  deleteSavingsProject,
  addSavingsContribution,
} from "@/lib/actions/savings-actions";
import { formatCHF, toNumber } from "@/utils/currency";
import { formatDate, todayISO } from "@/utils/dates";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ec4899", "#8b5cf6", "#06b6d4"];

export function SavingsClient({ projects }: { projects: SavingsProject[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsProject | null>(null);
  const [contributing, setContributing] = useState<SavingsProject | null>(null);
  const [pending, startTransition] = useTransition();

  const totalSaved = projects.reduce((s, p) => s + toNumber(p.savedAmount), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total épargné</p>
          <p className="text-2xl font-bold">{formatCHF(totalSaved)}</p>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={() => setFormOpen(true)}>
        <Plus /> Nouveau projet d&apos;épargne
      </Button>

      {projects.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Aucun projet d&apos;épargne.
        </p>
      )}

      {projects.map((p) => {
        const goal = toNumber(p.goalAmount);
        const saved = toNumber(p.savedAmount);
        const pct = goal > 0 ? (saved / goal) * 100 : 0;
        return (
          <Card key={p.id}>
            <CardContent className="space-y-2 py-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: p.color ?? "#22c55e" }}
                  />
                  {p.name}
                </p>
                <span className="text-xs text-muted-foreground">
                  {pct.toFixed(0)} %
                </span>
              </div>
              <Progress value={pct} color={p.color ?? undefined} />
              <p className="text-xs text-muted-foreground">
                {formatCHF(saved)} sur {formatCHF(goal)}
                {p.targetDate && <> · objectif {formatDate(p.targetDate)}</>}
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => setContributing(p)}>
                  <PiggyBank /> Verser
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(p)}>
                  <Pencil /> Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={pending}
                  onClick={() => {
                    if (confirm("Supprimer ce projet ?"))
                      startTransition(() => deleteSavingsProject(p.id));
                  }}
                >
                  <Trash2 />
                </Button>
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
        <DialogContent title={editing ? "Modifier le projet" : "Nouveau projet"}>
          <ProjectForm
            project={editing ?? undefined}
            onDone={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!contributing} onOpenChange={(o) => !o && setContributing(null)}>
        <DialogContent title={`Versement — ${contributing?.name ?? ""}`}>
          {contributing && (
            <ContributionForm
              project={contributing}
              onDone={() => setContributing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectForm({
  project,
  onDone,
}: {
  project?: SavingsProject;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [color, setColor] = useState(project?.color ?? COLORS[0]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("color", color);
    startTransition(async () => {
      if (project) await updateSavingsProject(project.id, fd);
      else await createSavingsProject(fd);
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="s-name">Nom du projet</Label>
        <Input
          id="s-name"
          name="name"
          placeholder="ex. Vacances, Voiture…"
          defaultValue={project?.name ?? ""}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="s-goal">Objectif (CHF)</Label>
          <Input
            id="s-goal"
            name="goalAmount"
            type="number"
            step="0.05"
            min="0.05"
            inputMode="decimal"
            defaultValue={project?.goalAmount ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-date">Date cible (optionnel)</Label>
          <Input
            id="s-date"
            name="targetDate"
            type="date"
            defaultValue={project?.targetDate ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Couleur</Label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Couleur ${c}`}
              className={`size-8 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Enregistrement…" : project ? "Modifier" : "Créer"}
      </Button>
    </form>
  );
}

function ContributionForm({
  project,
  onDone,
}: {
  project: SavingsProject;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("projectId", project.id);
    startTransition(async () => {
      await addSavingsContribution(fd);
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-amount">Montant (CHF)</Label>
          <Input
            id="c-amount"
            name="amount"
            type="number"
            step="0.05"
            min="0.05"
            inputMode="decimal"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-date">Date</Label>
          <Input id="c-date" name="date" type="date" defaultValue={todayISO()} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-note">Note (optionnel)</Label>
        <Textarea id="c-note" name="note" rows={2} />
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
        {pending ? "Enregistrement…" : "Verser"}
      </Button>
    </form>
  );
}
