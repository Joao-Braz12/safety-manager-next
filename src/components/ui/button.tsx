"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,color,border,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bone)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-ink)] text-white hover:bg-[var(--color-graphite-800)]",
        accent:
          "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-deep)]",
        outline:
          "border border-[var(--color-ink)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white",
        ghost:
          "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-graphite-100)]",
        soft:
          "bg-[var(--color-graphite-100)] text-[var(--color-ink)] hover:bg-[var(--color-graphite-200)]",
        link:
          "p-0 h-auto text-[var(--color-ink)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs uppercase tracking-[0.08em]",
        md: "h-11 px-5 text-sm uppercase tracking-[0.08em]",
        lg: "h-14 px-7 text-sm uppercase tracking-[0.12em]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
