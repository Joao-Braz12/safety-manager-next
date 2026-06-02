"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, ShieldCheck, AlertTriangle, PlayCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { useT, useLocale, intlLocale } from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate, formatDuration, formatId } from "@/lib/utils";

type Video = { id: number; title: string; url: string; duration: number };
type Briefing = {
  id: number;
  title: string;
  description: string | null;
  videos: Video[];
};
type Assignment = {
  id: number;
  briefingId: number;
  assignedAt: string;
  status: "PENDING" | "COMPLETED";
  briefing: Briefing;
};
type VideoProgress = {
  id: number;
  videoId: number;
  watchedTime: number;
  completed: boolean;
};

export default function DashboardPage() {
  const { session } = useAuth();
  const t = useT();
  const { locale } = useLocale();
  const userId = useUserIdFromToken();
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [progressByVideo, setProgressByVideo] = useState<Map<number, VideoProgress>>(
    new Map(),
  );
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const list = await api.get<Assignment[]>(`/api/assignments/user/${userId}`);
        setAssignments(list);
        const allProgress: VideoProgress[] = [];
        // (No bulk progress endpoint; we infer per assignment by fetching briefings detail later if needed.)
        setProgressByVideo(new Map(allProgress.map((p) => [p.videoId, p])));
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "Failed to load");
      }
    })();
  }, [userId]);

  const pending = useMemo(
    () => (assignments ?? []).filter((a) => a.status === "PENDING"),
    [assignments],
  );
  const completed = useMemo(
    () => (assignments ?? []).filter((a) => a.status === "COMPLETED"),
    [assignments],
  );

  const totalMinutes = useMemo(
    () =>
      Math.round(
        (assignments ?? []).reduce(
          (acc, a) =>
            acc + a.briefing.videos.reduce((s, v) => s + v.duration, 0) / 60,
          0,
        ),
      ),
    [assignments],
  );

  const firstName = session?.fullName.split(" ")[0] ?? "there";

  return (
    <div className="max-w-[1480px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      {/* Hero */}
      <section className="grid grid-cols-12 gap-8 lg:gap-12 mb-14">
        <div className="col-span-12 lg:col-span-8 reveal">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-6 flex items-center gap-3">
            <span>{t("dashboard.operatorBrief")} / {formatDate(new Date(), intlLocale(locale))}</span>
            <span className="flex-1 h-px bg-[var(--color-graphite-200)] mt-px" />
            <span>UTC {new Date().toUTCString().slice(17, 22)}</span>
          </div>
          <h1 className="font-display font-black text-5xl lg:text-7xl leading-[0.92] tracking-[-0.04em] text-[var(--color-ink)]">
            {t("dashboard.greeting")}
            <br />
            <span className="text-[var(--color-brand)]">{firstName}.</span>
          </h1>
          <p className="mt-6 text-[var(--color-graphite-600)] max-w-xl text-lg leading-relaxed">
            {t(
              pending.length === 1 ? "dashboard.awaiting_one" : "dashboard.awaiting_other",
              { count: pending.length },
            )}{" "}
            {t("dashboard.viewingTime", { min: totalMinutes })}
          </p>
        </div>

        <aside className="col-span-12 lg:col-span-4 reveal reveal-2">
          <div className="bg-[var(--color-ink)] text-white p-7 relative overflow-hidden">
            <div className="noise" />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
              {t("dashboard.complianceStatus")}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <ShieldCheck className="h-7 w-7 text-[var(--color-brand)]" />
              <span className="font-display font-black text-5xl">
                {assignments
                  ? Math.round(
                      ((completed.length / Math.max(1, assignments.length)) * 100) ||
                        0,
                    )
                  : "—"}
                <span className="text-2xl">%</span>
              </span>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {t("dashboard.briefingsComplete", {
                completed: completed.length,
                total: assignments?.length ?? 0,
              })}
            </p>
            <div className="mt-5 h-px bg-white/15" />
            <div className="mt-5 grid grid-cols-2 gap-4 text-[10px] font-mono uppercase tracking-[0.16em] text-white/55">
              <div>
                <div className="text-white text-lg font-display font-bold">
                  {pending.length}
                </div>
                {t("dashboard.pending")}
              </div>
              <div>
                <div className="text-white text-lg font-display font-bold">
                  {completed.length}
                </div>
                {t("dashboard.complete")}
              </div>
            </div>
          </div>
        </aside>
      </section>

      {err && (
        <div className="mb-6 p-4 bg-[var(--color-brand-soft)] border-l-4 border-[var(--color-brand)] flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[var(--color-brand)] shrink-0 mt-0.5" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-brand-deep)]">
              {t("dashboard.couldntLoad")}
            </div>
            <p className="text-sm text-[var(--color-ink)]">{err}</p>
          </div>
        </div>
      )}

      {/* Pending */}
      <section className="mb-16">
        <header className="flex items-end justify-between mb-6 pb-3 hairline-strong border-t-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-2">
              {t("dashboard.actionRequired")}
            </div>
            <h2 className="font-display font-bold text-2xl tracking-tight">
              {t("dashboard.pendingBriefings")}
            </h2>
          </div>
          <div className="font-mono text-xs text-[var(--color-graphite-500)]">
            {t(pending.length === 1 ? "dashboard.items_one" : "dashboard.items_other", {
              count: pending.length,
            })}
          </div>
        </header>

        {!assignments && <SkeletonGrid />}
        {assignments && pending.length === 0 && (
          <EmptyState
            title={t("dashboard.allClear")}
            message={t("dashboard.allClearMsg")}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pending.map((a, i) => (
            <BriefingCard key={a.id} assignment={a} index={i} status="pending" t={t} />
          ))}
        </div>
      </section>

      {/* Completed */}
      <section>
        <header className="flex items-end justify-between mb-6 pb-3 hairline-strong border-t-0">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-2">
              {t("dashboard.archive")}
            </div>
            <h2 className="font-display font-bold text-2xl tracking-tight">
              {t("dashboard.completedHeading")}
            </h2>
          </div>
          <div className="font-mono text-xs text-[var(--color-graphite-500)]">
            {t(completed.length === 1 ? "dashboard.items_one" : "dashboard.items_other", {
              count: completed.length,
            })}
          </div>
        </header>

        {assignments && completed.length === 0 ? (
          <EmptyState
            title={t("dashboard.noCompleted")}
            message={t("dashboard.noCompletedMsg")}
            muted
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {completed.map((a, i) => (
              <BriefingCard key={a.id} assignment={a} index={i} status="completed" t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BriefingCard({
  assignment,
  index,
  status,
  t,
}: {
  assignment: Assignment;
  index: number;
  status: "pending" | "completed";
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const totalSec = assignment.briefing.videos.reduce((s, v) => s + v.duration, 0);
  return (
    <Link
      href={`/briefings/${assignment.briefing.id}`}
      className={`reveal reveal-${Math.min(6, index + 1)} group relative bg-white border border-[var(--color-graphite-200)] hover:border-[var(--color-ink)] transition-colors`}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)]">
            BRIEF / {formatId(assignment.briefing.id)}
          </span>
          {status === "pending" ? (
            <Badge variant="accent">
              <Clock className="h-2.5 w-2.5" /> {t("common.pending")}
            </Badge>
          ) : (
            <Badge variant="success">
              <ShieldCheck className="h-2.5 w-2.5" /> {t("common.signed")}
            </Badge>
          )}
        </div>

        <h3 className="font-display font-bold text-xl leading-tight text-[var(--color-ink)] mb-3 group-hover:text-[var(--color-brand)] transition-colors">
          {assignment.briefing.title}
        </h3>

        {assignment.briefing.description && (
          <p className="text-sm text-[var(--color-graphite-600)] line-clamp-3 mb-6">
            {assignment.briefing.description}
          </p>
        )}

        <div className="mt-auto pt-5 border-t border-[var(--color-graphite-200)] flex items-center justify-between">
          <div className="font-mono text-[11px] text-[var(--color-graphite-500)] flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="h-3.5 w-3.5" />
              {t(
                assignment.briefing.videos.length === 1
                  ? "dashboard.videos_one"
                  : "dashboard.videos_other",
                { count: assignment.briefing.videos.length },
              )}
            </span>
            <span>·</span>
            <span>{formatDuration(totalSec)}</span>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[var(--color-graphite-400)] group-hover:text-[var(--color-brand)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Hover accent strip */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--color-brand)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-[var(--color-graphite-200)] h-52 animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  message,
  muted,
}: {
  title: string;
  message: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`relative border ${muted ? "border-dashed border-[var(--color-graphite-300)]" : "border-[var(--color-graphite-300)]"} p-10 text-center`}
    >
      <div className="font-display font-bold text-lg text-[var(--color-ink)]">
        {title}
      </div>
      <p className="text-sm text-[var(--color-graphite-600)] mt-2">{message}</p>
    </div>
  );
}

// Decode user ID from JWT in localStorage (sub claim only; we trust this for filtering)
function useUserIdFromToken(): number | null {
  const { session } = useAuth();
  return useMemo(() => {
    if (!session) return null;
    try {
      const [, payload] = session.token.split(".");
      const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = JSON.parse(atob(padded));
      return typeof json.uid === "number" ? json.uid : null;
    } catch {
      return null;
    }
  }, [session]);
}
