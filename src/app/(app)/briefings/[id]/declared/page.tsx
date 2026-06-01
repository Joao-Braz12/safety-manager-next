"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useT, useLocale, intlLocale } from "@/i18n";
import { api } from "@/lib/api-client";
import { formatDateTime, formatId } from "@/lib/utils";

type Declaration = {
  id: number;
  signatureName: string | null;
  confirmed: boolean;
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export default function DeclaredPage() {
  const params = useParams<{ id: string }>();
  const { session } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const briefingId = Number(params.id);
  const [decl, setDecl] = useState<Declaration | null>(null);

  useEffect(() => {
    if (!briefingId) return;
    (async () => {
      try {
        const d = await api.get<Declaration>(
          `/api/progress/declare?briefingId=${briefingId}`,
        );
        setDecl(d);
      } catch {
        // Fall back to session/now if the record can't be fetched.
      }
    })();
  }, [briefingId]);

  const signedAt = decl ? new Date(decl.timestamp) : new Date();
  const signatory = decl?.signatureName ?? session?.fullName ?? "—";
  const dt = (d: Date) => formatDateTime(d, intlLocale(locale));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl reveal">
        <div className="relative bg-[var(--color-ink)] text-white p-10 lg:p-14 overflow-hidden">
          <div className="noise" />

          {/* Stamp */}
          <div className="absolute top-7 right-7 hidden md:block">
            <div className="border-2 border-[var(--color-acciona-red)] text-[var(--color-acciona-red)] font-display font-black px-3 py-2 -rotate-6 text-xs uppercase tracking-[0.18em]">
              {t("declared.stamp")}
            </div>
          </div>

          <CheckCircle2 className="h-14 w-14 text-[var(--color-acciona-red)] mb-8" />

          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55 mb-3">
            {t("declared.receipt")} / {formatId(briefingId)} · {dt(signedAt)}
          </div>
          <h1 className="font-display font-black text-4xl lg:text-5xl tracking-[-0.03em] leading-[0.95]">
            {t("declared.title")}
          </h1>
          <p className="mt-5 text-white/70 text-lg leading-relaxed">
            {t("declared.message")}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-px bg-white/15">
            <Stat label={t("declared.signatory")} value={signatory} />
            <Stat label={t("declared.timestamp")} value={dt(signedAt)} mono />
            <Stat label={t("declared.method")} value={t("declared.methodValue")} />
          </div>

          {/* Audit trail — proof the company can rely on */}
          <div className="mt-px grid grid-cols-2 gap-px bg-white/15">
            <Stat label={t("declared.ipAddress")} value={decl?.ipAddress ?? "—"} mono />
            <Stat label={t("declared.device")} value={decl?.userAgent ?? "—"} mono />
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/dashboard">
                {t("declared.backToDashboard")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[var(--color-ink)]">
              <Link href={`/briefings/${params.id}`}>{t("declared.rewatch")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-[var(--color-ink)] p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 mb-1">
        {label}
      </div>
      <div className={`text-sm text-white truncate ${mono ? "font-mono" : ""}`} title={value}>
        {value}
      </div>
    </div>
  );
}
