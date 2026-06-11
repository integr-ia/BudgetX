import { create } from "zustand";

interface DataStore {
  version: number;
  bump: () => void;
}

/** Compteur global incrémenté après chaque mutation pour rafraîchir les requêtes. */
export const useDataStore = create<DataStore>((set) => ({
  version: 0,
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
