"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))]">
      <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-1">
        {action}
        <ThemeToggle />
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("budgetx-theme", next ? "dark" : "light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Changer de thème">
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
