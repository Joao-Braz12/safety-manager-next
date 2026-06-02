"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Film, Play } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { PageBody, PageHeader, TableShell, EmptyRow } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Label, FieldError } from "@/components/ui/input";
import { formatDuration, formatId } from "@/lib/utils";
import {
  RiskBadge,
  RiskCategorySelect,
  RiskGroupFilter,
  RISK_NONE,
  RISK_ALL,
  matchesGroup,
} from "@/components/risk-category";

type Video = {
  id: number;
  title: string;
  url: string;
  duration: number;
  companyId: number | null;
  riskCategory: string | null;
};

export default function VideosPage() {
  const [items, setItems] = useState<Video[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", url: "", minutes: "", seconds: "" });
  const [category, setCategory] = useState<string>(RISK_NONE);
  const [filter, setFilter] = useState<string>(RISK_ALL);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function load() {
    try {
      const list = await api.get<Video[]>("/api/videos");
      setItems(list);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(undefined);
    try {
      await api.post<Video>("/api/videos", {
        title: form.title,
        url: form.url,
        duration: Number(form.minutes || 0) * 60 + Number(form.seconds || 0),
        riskCategory: category === RISK_NONE ? null : category,
      });
      setForm({ title: "", url: "", minutes: "", seconds: "" });
      setCategory(RISK_NONE);
      setOpen(false);
      load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  const visible =
    items && filter !== RISK_ALL
      ? items.filter((v) => matchesGroup(v.riskCategory, filter))
      : items;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Library / Videos"
        title="Video library"
        description="Source training videos. Each video must declare its duration so completion can be tracked."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4" /> New video
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register video</DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-5">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Working at heights — fall protection"
                  />
                </div>
                <div>
                  <Label htmlFor="url">Video URL</Label>
                  <Input
                    id="url"
                    required
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="https://cdn.../video.mp4"
                  />
                  <span className="mt-1 block font-mono text-[10px] leading-relaxed text-[var(--color-graphite-500)]">
                    Must be a direct video file (.mp4 / .webm) — not a YouTube or Vimeo
                    page link. Use <code>/sample/safety-demo.mp4</code> for testing.
                  </span>
                </div>
                <div>
                  <Label>Risk category</Label>
                  <RiskCategorySelect value={category} onChange={setCategory} />
                </div>
                <div>
                  <Label htmlFor="minutes">Duration</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Input
                        id="minutes"
                        type="number"
                        min={0}
                        required
                        value={form.minutes}
                        onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))}
                        placeholder="4"
                      />
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
                        Minutes
                      </span>
                    </div>
                    <div>
                      <Input
                        id="seconds"
                        type="number"
                        min={0}
                        max={59}
                        value={form.seconds}
                        onChange={(e) => setForm((f) => ({ ...f, seconds: e.target.value }))}
                        placeholder="00"
                      />
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
                        Seconds
                      </span>
                    </div>
                  </div>
                </div>
                <FieldError message={err} />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="accent" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)]">
          Filter
        </span>
        <div className="w-72">
          <RiskGroupFilter value={filter} onChange={setFilter} />
        </div>
      </div>

      <TableShell headers={["ID", "Title", "Risk category", "Duration", "URL"]}>
        {!items && (
          <tr>
            <td colSpan={5} className="py-10 text-center text-[var(--color-graphite-500)]">
              Loading…
            </td>
          </tr>
        )}
        {visible && visible.length === 0 && (
          <EmptyRow colSpan={5} message="No videos match this filter." />
        )}
        {visible?.map((v) => (
          <tr key={v.id} className="hover:bg-[var(--color-graphite-50)]">
            <td className="px-5 py-4 font-mono text-xs text-[var(--color-graphite-600)]">
              {formatId(v.id)}
            </td>
            <td className="px-5 py-4">
              <span className="flex items-center gap-3">
                <Film className="h-4 w-4 text-[var(--color-graphite-400)]" />
                <span className="font-medium">{v.title}</span>
              </span>
            </td>
            <td className="px-5 py-4">
              {v.riskCategory ? (
                <RiskBadge code={v.riskCategory} />
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-graphite-400)]">
                  —
                </span>
              )}
            </td>
            <td className="px-5 py-4 font-mono text-sm">{formatDuration(v.duration)}</td>
            <td className="px-5 py-4">
              <a
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--color-brand)] hover:underline truncate max-w-xs"
              >
                <Play className="h-3 w-3" /> {v.url}
              </a>
            </td>
          </tr>
        ))}
      </TableShell>
    </PageBody>
  );
}
