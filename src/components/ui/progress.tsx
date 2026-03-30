import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div className="h-full rounded-full bg-sky-500 transition-all duration-300" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

