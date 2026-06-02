"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-bone)]">
      <div className="max-w-md text-center">
        <ShieldAlert className="h-16 w-16 mx-auto text-[var(--color-brand)] mb-6" />
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-3">
          403 · Forbidden
        </div>
        <h1 className="font-display font-black text-4xl tracking-tight text-[var(--color-ink)]">
          No access here.
        </h1>
        <p className="mt-4 text-[var(--color-graphite-600)]">
          Your role doesn't have permission to view this area.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Return to safety</Link>
        </Button>
      </div>
    </div>
  );
}
