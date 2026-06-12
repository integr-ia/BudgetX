import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-4 flex items-center justify-between pt-[env(safe-area-inset-top)]">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {action}
        <ThemeToggle />
      </div>
    </header>
  );
}
