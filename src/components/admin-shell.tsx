"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 mb-10 reveal">
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-3">
          {eyebrow}
        </div>
        <h1 className="font-display font-black text-4xl lg:text-5xl tracking-[-0.03em] leading-[0.95] text-[var(--color-ink)]">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-[var(--color-graphite-600)] max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 lg:px-10 py-10 lg:py-14 max-w-[1400px]", className)}>
      {children}
    </div>
  );
}

export function DataCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-7 border",
        accent
          ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
          : "bg-white border-[var(--color-graphite-200)]",
      )}
    >
      <div
        className={cn(
          "font-mono text-[10px] uppercase tracking-[0.18em] mb-4",
          accent ? "text-white/55" : "text-[var(--color-graphite-500)]",
        )}
      >
        {label}
      </div>
      <div className="font-display font-black text-5xl tracking-tight">{value}</div>
      {hint && (
        <div
          className={cn(
            "mt-3 text-sm",
            accent ? "text-white/60" : "text-[var(--color-graphite-600)]",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[var(--color-graphite-200)] overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-ink)]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-600)] px-5 py-4"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-graphite-200)]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function ExpandedCell({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr className="bg-[var(--color-graphite-50)]">
      <td colSpan={colSpan} className="px-5 py-5 border-l-2 border-[var(--color-brand)]">
        {children}
      </td>
    </tr>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-14 text-[var(--color-graphite-500)]">
        {message}
      </td>
    </tr>
  );
}
