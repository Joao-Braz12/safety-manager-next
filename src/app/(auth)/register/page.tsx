"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/i18n";
import { ApiError, api, type Session } from "@/lib/api-client";

type Company = { id: number; name: string };

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const t = useT();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [err, setErr] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<Company[]>("/api/companies")
      .then((data) => setCompanies(data))
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined);
    if (!companyId) {
      setErr(t("register.selectError"));
      return;
    }
    setSubmitting(true);
    try {
      const s = await api.post<Session>("/api/auth/register", {
        fullName,
        email,
        password,
        companyId: Number(companyId),
      });
      signIn(s);
      router.push("/dashboard");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t("register.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 reveal">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-4">
          {t("register.eyebrow")}
        </div>
        <h2 className="font-display font-black text-4xl tracking-tight text-[var(--color-ink)]">
          {t("register.title")}
        </h2>
        <p className="mt-3 text-[var(--color-graphite-600)]">
          {t("register.subtitle")}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <div>
          <Label htmlFor="fullName">{t("register.fullName")}</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <Label htmlFor="email">{t("register.email")}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </div>

        <div>
          <Label htmlFor="password">{t("register.password")}</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("register.passwordPlaceholder")}
          />
        </div>

        <div>
          <Label>{t("register.company")}</Label>
          <Select value={companyId} onValueChange={setCompanyId} disabled={companiesLoading}>
            <SelectTrigger>
              <SelectValue
                placeholder={companiesLoading ? t("common.loading") : t("register.selectCompany")}
              />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {t("register.creating")}
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              {t("register.submit")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="hairline pt-5 flex items-center justify-between text-sm">
        <span className="text-[var(--color-graphite-600)]">{t("register.haveAccount")}</span>
        <Link
          href="/login"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-ink)] hover:text-[var(--color-brand)] transition-colors"
        >
          {t("register.signIn")} →
        </Link>
      </div>
    </div>
  );
}
