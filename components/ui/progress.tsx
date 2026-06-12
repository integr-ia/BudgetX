import * as React from "react";
import { cn } from "@/lib/utils";

function Progress({
  value = 0,
  color,
  className,
}: {
  value?: number;
  color?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}

export { Progress };
