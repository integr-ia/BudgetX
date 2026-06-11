"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TransactionFormDialog } from "@/components/forms/TransactionFormDialog";

export function Fab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ajouter une transaction"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        <Plus className="size-7" />
      </button>
      <TransactionFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
