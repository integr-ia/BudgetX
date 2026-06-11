"use client";

import { useEffect, useState } from "react";
import { getDb, type Db } from "@/db/client";
import { useDataStore } from "@/stores/useDataStore";

/**
 * Exécute une requête PGlite côté client et se rafraîchit automatiquement
 * quand le compteur de version global change (après une mutation).
 */
export function useDbQuery<T>(query: (db: Db) => Promise<T>): {
  data: T | null;
  loading: boolean;
} {
  const version = useDataStore((s) => s.version);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDb()
      .then(query)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erreur de requête PGlite:", err);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return { data, loading };
}

/** Exécute une mutation puis notifie toutes les requêtes actives. */
export async function mutate(fn: (db: Db) => Promise<unknown>) {
  const db = await getDb();
  await fn(db);
  useDataStore.getState().bump();
}
