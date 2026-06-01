"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const router = useRouter();
  const { session, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!session) router.replace("/login");
    else if (session.role === "ROLE_USER") router.replace("/dashboard");
    else router.replace("/admin");
  }, [hydrated, session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bone)]">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)]">
        Routing…
      </div>
    </div>
  );
}
