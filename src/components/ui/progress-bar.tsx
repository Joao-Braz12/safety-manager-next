import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  accent = false,
}: {
  value: number; // 0..100
  className?: string;
  accent?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "relative h-1 w-full bg-[var(--color-graphite-200)] overflow-hidden",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-500 ease-out",
          accent ? "bg-[var(--color-brand)]" : "bg-[var(--color-ink)]",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
