"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eq } from "drizzle-orm";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";

export default function OnboardingPage() {
  const router = useRouter();
  const [balance, setBalance] = useState("");
  const [salary, setSalary] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = balance !== "" && salary !== "";

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const db = await getDb();
    await db
      .update(schema.profile)
      .set({
        initialBalance: String(parseFloat(balance) || 0),
        monthlySalary: String(parseFloat(salary) || 0),
        onboardingDone: true,
      })
      .where(eq(schema.profile.id, "default"));
    router.replace("/dashboard");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet className="size-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">BudgetX</h1>
        <p className="text-sm text-muted-foreground">
          Vos finances personnelles, 100% privées et hors ligne.
          <br />
          Deux informations pour commencer :
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ob-balance">Solde bancaire actuel (CHF)</Label>
            <Input
              id="ob-balance"
              type="number"
              inputMode="decimal"
              step="0.05"
              placeholder="ex : 2'500.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-salary">Salaire mensuel net (CHF)</Label>
            <Input
              id="ob-salary"
              type="number"
              inputMode="decimal"
              step="0.05"
              placeholder="ex : 5'000.00"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={submit}>
            {saving ? "Enregistrement…" : "Commencer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
