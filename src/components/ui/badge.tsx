import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 leading-none",
  {
    variants: {
      variant: {
        ink: "bg-[var(--color-ink)] text-white",
        accent: "bg-[var(--color-acciona-red)] text-white",
        soft: "bg-[var(--color-graphite-100)] text-[var(--color-ink)]",
        outline: "border border-[var(--color-ink)] text-[var(--color-ink)]",
        success: "bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30",
        warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/30",
        danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/30",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
