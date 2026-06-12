"use client";

import { create } from "zustand";

interface UIStore {
  txDialogOpen: boolean;
  setTxDialogOpen: (open: boolean) => void;
}

/** État UI global (Zustand) — ouverture du formulaire transaction depuis le FAB. */
export const useUIStore = create<UIStore>((set) => ({
  txDialogOpen: false,
  setTxDialogOpen: (open) => set({ txDialogOpen: open }),
}));
