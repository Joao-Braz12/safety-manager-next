"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  PlayCircle,
  Lock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { VideoPlayer } from "@/components/video-player";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/i18n";
import { formatDuration, formatId } from "@/lib/utils";

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
  status: "PENDING" | "COMPLETED";
  briefing: Briefing;
};
type VideoProgress = {
  id: number;
  userId: number;
  videoId: number;
  watchedTime: number;
  completed: boolean;
};

export default function BriefingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const briefingId = Number(params.id);
  const { session } = useAuth();
  const t = useT();
  const userId = useUserIdFromToken();

  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [progressMap, setProgressMap] = useState<Map<number, VideoProgress>>(new Map());
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [signatureName, setSignatureName] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!briefingId || !userId) return;
    (async () => {
      try {
        const [b, assignments] = await Promise.all([
          api.get<Briefing>(`/api/briefings/${briefingId}`),
          api.get<Assignment[]>(`/api/assignments/user/${userId}`),
        ]);
        setBriefing(b);
        const myAssignment = assignments.find((a) => a.briefingId === briefingId);
        setAssignment(myAssignment ?? null);
        setActiveVideoId(b.videos[0]?.id ?? null);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : t("briefing.loadFailed"));
      }
    })();
  }, [briefingId, userId]);

  useEffect(() => {
    if (session?.fullName) setSignatureName((prev) => prev || session.fullName);
  }, [session?.fullName]);

  const activeVideo = useMemo(
    () => briefing?.videos.find((v) => v.id === activeVideoId) ?? null,
    [briefing, activeVideoId],
  );

  function setProgress(videoId: number, watchedTime: number, completed: boolean) {
    setProgressMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(videoId);
      next.set(videoId, {
        id: existing?.id ?? -1,
        userId: userId ?? -1,
        videoId,
        watchedTime,
        completed: completed || (existing?.completed ?? false),
      });
      return next;
    });
  }

  async function reportProgress(videoId: number, watchedTime: number) {
    try {
      const updated = await api.post<VideoProgress>("/api/progress", {
        videoId,
        watchedTime,
      });
      setProgress(videoId, updated.watchedTime, updated.completed);
    } catch {
      // swallow; will retry on next tick
    }
  }

  const allCompleted = useMemo(() => {
    if (!briefing) return false;
    return briefing.videos.every((v) => progressMap.get(v.id)?.completed);
  }, [briefing, progressMap]);

  const completedCount = useMemo(
    () =>
      (briefing?.videos ?? []).filter((v) => progressMap.get(v.id)?.completed).length,
    [briefing, progressMap],
  );

  const overallPct = briefing
    ? (completedCount / Math.max(1, briefing.videos.length)) * 100
    : 0;

  const canSign = allCompleted && agreed && signatureName.trim().length >= 2;

  async function declare() {
    if (!briefing || !canSign) return;
    setSubmitting(true);
    setErr(undefined);
    try {
      await api.post("/api/progress/declare", {
        briefingId: briefing.id,
        confirmed: true,
        signatureName: signatureName.trim(),
      });
      router.push(`/briefings/${briefing.id}/declared`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t("briefing.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!briefing) {
    return (
      <div className="max-w-[1480px] mx-auto px-6 lg:px-10 py-20 text-center">
        {err ? (
          <p className="text-[var(--color-acciona-red-deep)]">{err}</p>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
            {t("briefing.loadingBriefing")}
          </p>
        )}
      </div>
    );
  }

  const alreadyDeclared = assignment?.status === "COMPLETED";

  return (
    <div className="max-w-[1480px] mx-auto px-6 lg:px-10 py-8 lg:py-12">
      {/* Crumb */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-[var(--color-graphite-500)] hover:text-[var(--color-acciona-red)] transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("briefing.backToDashboard")}
      </Link>

      {/* Header */}
      <header className="grid grid-cols-12 gap-8 mb-10 reveal">
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)]">
              Briefing / {formatId(briefing.id)}
            </span>
            {alreadyDeclared ? (
              <Badge variant="success">
                <ShieldCheck className="h-2.5 w-2.5" /> {t("briefing.declared")}
              </Badge>
            ) : assignment ? (
              <Badge variant="accent">{t("briefing.assigned")}</Badge>
            ) : null}
          </div>
          <h1 className="font-display font-black text-5xl lg:text-6xl leading-[0.95] tracking-[-0.03em] text-[var(--color-ink)]">
            {briefing.title}
          </h1>
          {briefing.description && (
            <p className="mt-6 text-[var(--color-graphite-600)] max-w-2xl text-lg leading-relaxed">
              {briefing.description}
            </p>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 reveal reveal-2">
          <div className="bg-white border border-[var(--color-graphite-200)] p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)] mb-3">
              {t("briefing.yourProgress")}
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-display font-black text-5xl text-[var(--color-ink)]">
                {Math.round(overallPct)}
              </span>
              <span className="text-2xl text-[var(--color-graphite-500)] font-display font-bold">
                %
              </span>
            </div>
            <ProgressBar value={overallPct} accent />
            <div className="mt-3 font-mono text-[11px] text-[var(--color-graphite-500)]">
              {t("briefing.videosCompleted", {
                completed: completedCount,
                total: briefing.videos.length,
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="grid grid-cols-12 gap-8">
        {/* Player */}
        <div className="col-span-12 lg:col-span-8 reveal reveal-3">
          {activeVideo ? (
            <>
              <VideoPlayer
                key={activeVideo.id}
                src={activeVideo.url}
                duration={activeVideo.duration}
                initialWatched={progressMap.get(activeVideo.id)?.watchedTime ?? 0}
                onProgress={(t) => reportProgress(activeVideo.id, t)}
                onComplete={() => reportProgress(activeVideo.id, activeVideo.duration)}
              />
              <div className="mt-5 flex items-start justify-between gap-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)] mb-1">
                    {t("briefing.nowPlaying")}
                  </div>
                  <h3 className="font-display font-bold text-2xl tracking-tight">
                    {activeVideo.title}
                  </h3>
                </div>
                <div className="font-mono text-xs text-[var(--color-graphite-500)] pt-2">
                  {formatDuration(activeVideo.duration)}
                </div>
              </div>
            </>
          ) : (
            <div className="aspect-video bg-[var(--color-ink)] flex items-center justify-center text-white/50">
              {t("briefing.noVideos")}
            </div>
          )}
        </div>

        {/* Playlist + declaration */}
        <aside className="col-span-12 lg:col-span-4 reveal reveal-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-3">
            {t("briefing.playlist")}
          </div>
          <ol className="bg-white border border-[var(--color-graphite-200)] divide-y divide-[var(--color-graphite-200)]">
            {briefing.videos.map((v, idx) => {
              const done = progressMap.get(v.id)?.completed;
              const active = v.id === activeVideoId;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setActiveVideoId(v.id)}
                    className={`w-full text-left px-4 py-4 flex items-center gap-4 transition-colors ${
                      active
                        ? "bg-[var(--color-ink)] text-white"
                        : "hover:bg-[var(--color-graphite-50)]"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center font-mono text-xs ${
                        done
                          ? "bg-[var(--color-acciona-red)] text-white"
                          : active
                            ? "bg-white text-[var(--color-ink)]"
                            : "bg-[var(--color-graphite-100)] text-[var(--color-graphite-600)]"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={`block text-sm font-medium truncate ${active ? "text-white" : "text-[var(--color-ink)]"}`}
                      >
                        {v.title}
                      </span>
                      <span
                        className={`block font-mono text-[10px] mt-0.5 ${active ? "text-white/60" : "text-[var(--color-graphite-500)]"}`}
                      >
                        {formatDuration(v.duration)}
                      </span>
                    </span>
                    <PlayCircle
                      className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-[var(--color-graphite-400)]"}`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Declaration block — only relevant when this briefing is assigned to the user */}
          {assignment && (
            <div className="mt-6 bg-[var(--color-ink)] text-white p-6 relative overflow-hidden">
              <div className="noise" />
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-acciona-red)] mb-3">
                {t("briefing.signDeclaration")}
              </div>
              <p className="text-sm text-white/80 mb-5 leading-relaxed">
                {t("briefing.signIntro")}
              </p>

              {err && (
                <div className="mb-3 text-xs text-[var(--color-acciona-red)] flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
                  <span>{err}</span>
                </div>
              )}

              {alreadyDeclared ? (
                <Button variant="accent" disabled className="w-full">
                  <CheckCircle2 className="h-4 w-4" /> {t("briefing.alreadyDeclared")}
                </Button>
              ) : (
                <>
                  {/* Signature: typed full name */}
                  <label
                    htmlFor="signatureName"
                    className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/55 mb-2"
                  >
                    {t("briefing.typeName")}
                  </label>
                  <input
                    id="signatureName"
                    type="text"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    disabled={!allCompleted || submitting}
                    placeholder={t("briefing.namePlaceholder")}
                    className="w-full bg-white/10 border border-white/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-[var(--color-acciona-red)] disabled:opacity-50 mb-4"
                  />

                  {/* Acknowledgement checkbox */}
                  <label className="flex items-start gap-3 mb-5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      disabled={!allCompleted || submitting}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-acciona-red)] disabled:opacity-50"
                    />
                    <span className="text-xs text-white/75 leading-relaxed">
                      {t("briefing.confirmText")}
                    </span>
                  </label>

                  <Button
                    variant="accent"
                    disabled={!canSign || submitting}
                    onClick={declare}
                    className="w-full justify-between"
                  >
                    {submitting ? (
                      <>
                        {t("briefing.signing")}
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </>
                    ) : !allCompleted ? (
                      <>
                        {t("briefing.finishVideos")}
                        <Lock className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {t("briefing.sign")}
                        <ShieldCheck className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Not assigned — make it clear there is nothing to acknowledge here */}
          {!assignment && (
            <div className="mt-6 border border-[var(--color-graphite-200)] bg-white p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-2">
                {t("briefing.referenceOnly")}
              </div>
              <p className="text-sm text-[var(--color-graphite-600)] leading-relaxed">
                {t("briefing.referenceMsg")}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

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
