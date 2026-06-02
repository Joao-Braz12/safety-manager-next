"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { ApiError, api } from "@/lib/api-client";
import { LogOut, Loader2, Check } from "lucide-react";

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

      <ChangePassword />

      <div className="mt-10">
        <Button variant="outline" onClick={signOut}>
          <LogOut className="h-4 w-4" /> {t("profile.signOut")}
        </Button>
      </div>
    </div>
  );
}

function ChangePassword() {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    setDone(false);

    if (newPassword.length < 6) {
      setErr(t("profile.password.tooShort"));
      return;
    }
    if (newPassword !== confirm) {
      setErr(t("profile.password.mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await api.put("/api/users/me/password", { currentPassword, newPassword });
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t("profile.password.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-14">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-6">
        {t("profile.password.title")}
      </div>

      <form onSubmit={onSubmit} className="space-y-7 max-w-md" noValidate>
        <div>
          <Label htmlFor="currentPassword">{t("profile.password.current")}</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <Label htmlFor="newPassword">{t("profile.password.new")}</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">{t("profile.password.confirm")}</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {err && <FieldError message={err} />}
        {done && (
          <p className="mt-2 text-xs text-[var(--color-brand)] font-mono flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> {t("profile.password.success")}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? (
            <>
              {t("profile.password.submitting")}
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            t("profile.password.submit")
          )}
        </Button>
      </form>
    </section>
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
