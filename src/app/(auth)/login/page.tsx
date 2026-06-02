"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/i18n";
import { ApiError, api, type Session } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    setSubmitting(true);
    try {
      const s = await api.post<Session>("/api/auth/login", { email, password });
      signIn(s);
      const dest =
        s.role === "ROLE_USER" ? "/dashboard" : "/admin";
      router.push(dest);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t("login.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10 reveal">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-4">
          {t("login.eyebrow")}
        </div>
        <h2 className="font-display font-black text-4xl tracking-tight text-[var(--color-ink)]">
          {t("login.title")}
        </h2>
        <p className="mt-3 text-[var(--color-graphite-600)]">
          {t("login.subtitle")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-7" noValidate>
        <div>
          <Label htmlFor="email">{t("login.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login.password")}</Label>
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
              JWT
            </span>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {err && <FieldError message={err} />}

        <Button
          type="submit"
          size="lg"
          variant="primary"
          className="w-full justify-between"
          disabled={submitting}
        >
          {submitting ? (
            <>
              {t("login.authenticating")}
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              {t("login.submit")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="hairline pt-6 flex items-center justify-between text-sm">
        <span className="text-[var(--color-graphite-600)]">{t("login.noAccount")}</span>
        <Link
          href="/register"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors"
        >
          {t("login.createAccount")} →
        </Link>
      </div>
    </div>
  );
}
