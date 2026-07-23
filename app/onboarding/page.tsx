import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProfile } from "@/db/queries";
import { completeOnboarding } from "@/lib/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Bienvenue — BudgetX" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const profile = await getProfile(session.user.id);
  if (profile?.onboardingDone) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/15">
            <Wallet className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Bienvenue sur BudgetX</h1>
          <p className="text-sm text-muted-foreground">
            Deux informations pour démarrer votre suivi financier.
          </p>
        </div>

        <form action={completeOnboarding} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="initialBalance">
              Solde bancaire actuel (CHF)
            </Label>
            <Input
              id="initialBalance"
              name="initialBalance"
              type="number"
              step="0.05"
              inputMode="decimal"
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monthlySalary">
              Salaire mensuel net (CHF)
            </Label>
            <Input
              id="monthlySalary"
              name="monthlySalary"
              type="number"
              step="0.05"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salaryDay">
              Jour de réception du salaire (optionnel)
            </Label>
            <Input
              id="salaryDay"
              name="salaryDay"
              type="number"
              min="1"
              max="31"
              step="1"
              placeholder="ex : 25"
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Commencer
          </Button>
        </form>
      </div>
    </main>
  );
}
