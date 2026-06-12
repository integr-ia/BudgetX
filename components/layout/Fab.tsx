"use client";

import { Plus } from "lucide-react";
import type { Category } from "@/db/schema";
import { useUIStore } from "@/stores/ui-store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/forms/TransactionForm";

/** FAB global : ajouter une transaction depuis n'importe quel écran. */
export function Fab({ categories }: { categories: Category[] }) {
  const { txDialogOpen, setTxDialogOpen } = useUIStore();

  return (
    <>
      <button
        onClick={() => setTxDialogOpen(true)}
        aria-label="Ajouter une transaction"
        className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 mb-[env(safe-area-inset-bottom)]"
      >
        <Plus className="size-7" />
      </button>
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent title="Nouvelle transaction">
          <TransactionForm
            categories={categories}
            onDone={() => setTxDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
