"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-12 w-full bg-transparent border-0 border-b border-[var(--color-graphite-300)]",
        "px-0 py-2 text-base text-[var(--color-ink)] placeholder:text-[var(--color-graphite-500)]",
        "transition-colors duration-200",
        "focus:outline-none focus:border-[var(--color-acciona-red)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-transparent border border-[var(--color-graphite-300)] rounded-sm",
      "px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-graphite-500)]",
      "transition-colors duration-200 resize-y min-h-[88px]",
      "focus:outline-none focus:border-[var(--color-acciona-red)]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block text-[10px] uppercase tracking-[0.18em] font-mono text-[var(--color-graphite-600)] mb-2",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-2 text-xs text-[var(--color-acciona-red-deep)] font-mono">
      ↳ {message}
    </p>
  );
}
