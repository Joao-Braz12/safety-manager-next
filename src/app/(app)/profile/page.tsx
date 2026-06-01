"use client";

import { useAuth } from "@/components/auth-provider";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function ProfilePage() {
  const { session, signOut } = useAuth();
  const t = useT();
  if (!session) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-14">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-4">
        {t("profile.title")}
      </div>
      <h1 className="font-display font-black text-5xl tracking-tight mb-10">
        {session.fullName}
      </h1>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--color-graphite-200)] border border-[var(--color-graphite-200)]">
        <Row label={t("profile.role")} value={t(`roles.${session.role}`)} />
        <Row label={t("profile.auth")} value="JWT · HS256" mono />
      </dl>

      <div className="mt-10">
        <Button variant="outline" onClick={signOut}>
          <LogOut className="h-4 w-4" /> {t("profile.signOut")}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-[var(--color-bone)] p-6">
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)] mb-2">
        {label}
      </dt>
      <dd className={`text-lg ${mono ? "font-mono" : "font-display font-semibold"}`}>
        {value}
      </dd>
    </div>
  );
}
