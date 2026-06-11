"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Fab } from "./Fab";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Applique le thème sauvegardé avant le premier rendu visible
  useEffect(() => {
    const theme = localStorage.getItem("budgetx-theme") ?? "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  useEffect(() => {
    let cancelled = false;
    getDb()
      .then((db) => db.select().from(schema.profile))
      .then((rows) => {
        if (cancelled) return;
        const done = rows[0]?.onboardingDone;
        if (!done && pathname !== "/onboarding") {
          router.replace("/onboarding");
        } else if (done && pathname === "/onboarding") {
          router.replace("/dashboard");
        } else {
          setReady(true);
        }
      })
      .catch((err) => {
        console.error("Initialisation PGlite échouée:", err);
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  const isOnboarding = pathname === "/onboarding";

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-background">
      <main className={isOnboarding ? "flex-1" : "flex-1 pb-24"}>{children}</main>
      {!isOnboarding && (
        <>
          <Fab />
          <BottomNav />
        </>
      )}
    </div>
  );
}
