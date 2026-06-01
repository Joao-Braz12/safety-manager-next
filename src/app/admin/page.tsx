"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, ClipboardList, Layers, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { PageBody, PageHeader, DataCard } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useAuth } from "@/components/auth-provider";

type Report = { totalAssigned: number; completed: number; pending: number };

export default function AdminConsolePage() {
  const { session } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    api
      .get<Report>("/api/reports")
      .then(setReport)
      .catch((e: ApiError) => {
        if (e.status === 403) setReport(null);
        else setErr(e.message);
      });
  }, []);

  const completionRate = report
    ? Math.round((report.completed / Math.max(1, report.totalAssigned)) * 100)
    : 0;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Console / Overview"
        title={
          <>
            Operations,
            <br />
            <span className="text-[var(--color-acciona-red)]">at a glance.</span>
          </>
        }
        description={`Real-time compliance posture across your${session?.role === "ROLE_ADMIN" ? " entire estate" : " company"}.`}
      />

      {err && (
        <p className="mb-6 text-sm text-[var(--color-acciona-red-deep)]">{err}</p>
      )}

      {report && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-graphite-200)] mb-10 reveal reveal-2">
            <DataCard
              label="Total assigned"
              value={report.totalAssigned}
              hint="Active assignments across the org"
            />
            <DataCard label="Completed" value={report.completed} hint="Signed & archived" accent />
            <DataCard label="Pending" value={report.pending} hint="Awaiting acknowledgement" />
          </section>

          <section className="bg-white border border-[var(--color-graphite-200)] p-8 mb-12 reveal reveal-3">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)] mb-2">
                  Completion rate
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display font-black text-6xl tracking-tight">
                    {completionRate}
                  </span>
                  <span className="font-display font-bold text-3xl text-[var(--color-graphite-500)]">
                    %
                  </span>
                </div>
              </div>
              <div className="text-right font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
                <div>{report.completed} of {report.totalAssigned}</div>
                <div className="mt-1">acknowledged</div>
              </div>
            </div>
            <ProgressBar value={completionRate} accent className="h-1.5" />
          </section>
        </>
      )}

      {/* Quick actions */}
      <section className="reveal reveal-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-4 pb-3 border-b border-[var(--color-ink)]">
          Quick actions
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-graphite-200)] border border-[var(--color-graphite-200)]">
          <QuickAction
            href="/admin/briefings"
            icon={ClipboardList}
            title="New briefing"
            hint="Compose a video set"
          />
          <QuickAction
            href="/admin/assignments"
            icon={Layers}
            title="Assign team"
            hint="Push a briefing to a crew"
          />
          <QuickAction
            href="/admin/users"
            icon={Users}
            title="Manage people"
            hint="Roles, teams & access"
          />
          <QuickAction
            href="/admin/reports"
            icon={Building2}
            title="Sign sheet"
            hint="Audit-ready evidence"
          />
        </div>
      </section>
    </PageBody>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-[var(--color-bone)] hover:bg-white p-6 transition-colors"
    >
      <div className="flex items-center justify-between mb-6">
        <Icon className="h-6 w-6 text-[var(--color-acciona-red)]" />
        <ArrowUpRight className="h-4 w-4 text-[var(--color-graphite-400)] group-hover:text-[var(--color-acciona-red)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="font-display font-bold text-lg leading-tight">{title}</div>
      <div className="text-sm text-[var(--color-graphite-600)] mt-1">{hint}</div>
    </Link>
  );
}
