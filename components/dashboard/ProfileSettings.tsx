"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import type { Profile } from "@/db/schema";
import { updateProfile } from "@/lib/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function ProfileSettings({ profile }: { profile: Profile | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProfile(fd);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Paramètres du profil">
          <Settings2 className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent title="Paramètres">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-initialBalance">
              Solde bancaire actuel (CHF)
            </Label>
            <Input
              id="settings-initialBalance"
              name="initialBalance"
              type="number"
              step="0.05"
              inputMode="decimal"
              defaultValue={profile?.initialBalance ?? "0"}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-monthlySalary">
              Salaire mensuel net (CHF)
            </Label>
            <Input
              id="settings-monthlySalary"
              name="monthlySalary"
              type="number"
              step="0.05"
              min="0"
              inputMode="decimal"
              defaultValue={profile?.monthlySalary ?? "0"}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-salaryDay">
              Jour de réception du salaire
            </Label>
            <Input
              id="settings-salaryDay"
              name="salaryDay"
              type="number"
              min="1"
              max="31"
              step="1"
              placeholder="ex : 25"
              defaultValue={profile?.salaryDay ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Utilisé pour calculer le solde projeté jusqu&apos;à votre
              prochain salaire.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
