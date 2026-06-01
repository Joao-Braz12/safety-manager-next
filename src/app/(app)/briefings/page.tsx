"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useT } from "@/i18n";
import { formatDuration, formatId } from "@/lib/utils";

type Briefing = {
  id: number;
  title: string;
  description: string | null;
  videos: { id: number; duration: number; title: string }[];
};

export default function BriefingsListPage() {
  const t = useT();
  const [briefings, setBriefings] = useState<Briefing[] | null>(null);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    api
      .get<Briefing[]>("/api/briefings")
      .then(setBriefings)
      .catch((e: ApiError) => setErr(e.message));
  }, []);

  return (
    <div className="max-w-[1480px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
      <header className="mb-12 reveal">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-4">
          {t("briefingsList.eyebrow")}
        </div>
        <h1 className="font-display font-black text-5xl tracking-[-0.03em] text-[var(--color-ink)]">
          {t("briefingsList.title")}
        </h1>
      </header>

      {err && <p className="text-sm text-[var(--color-acciona-red-deep)]">{err}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[var(--color-graphite-200)] border border-[var(--color-graphite-200)]">
        {(briefings ?? []).map((b, i) => (
          <Link
            key={b.id}
            href={`/briefings/${b.id}`}
            className={`reveal reveal-${Math.min(6, i + 1)} bg-[var(--color-bone)] hover:bg-white p-7 group transition-colors`}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)]">
                #{formatId(b.id)}
              </span>
              <ArrowUpRight className="h-4 w-4 text-[var(--color-graphite-400)] group-hover:text-[var(--color-acciona-red)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </div>
            <h2 className="font-display font-bold text-2xl leading-tight tracking-tight mb-3 group-hover:text-[var(--color-acciona-red)] transition-colors">
              {b.title}
            </h2>
            {b.description && (
              <p className="text-sm text-[var(--color-graphite-600)] line-clamp-2 mb-6">
                {b.description}
              </p>
            )}
            <div className="font-mono text-[11px] text-[var(--color-graphite-500)] flex items-center gap-3 pt-4 border-t border-[var(--color-graphite-200)]">
              <PlayCircle className="h-3.5 w-3.5" />
              {t(b.videos.length === 1 ? "dashboard.videos_one" : "dashboard.videos_other", {
                count: b.videos.length,
              })}{" "}
              · {formatDuration(b.videos.reduce((s, v) => s + v.duration, 0))}
            </div>
          </Link>
        ))}
        {briefings && briefings.length === 0 && (
          <div className="col-span-full bg-[var(--color-bone)] p-12 text-center text-[var(--color-graphite-600)]">
            {t("briefingsList.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
