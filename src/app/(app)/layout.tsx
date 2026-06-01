"use client";

import { AppTopbar } from "@/components/app-topbar";
import { useRequireAuth } from "@/components/auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { hydrated, session } = useRequireAuth();
  if (!hydrated || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bone)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)]">
          Authenticating…
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[var(--color-bone)]">
      <AppTopbar />
      <main>{children}</main>
    </div>
  );
}
