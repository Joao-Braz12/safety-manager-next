"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, ClipboardList, ArrowUpRight, Users, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { PageBody, PageHeader } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input, Label, Textarea, FieldError } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDuration, formatId } from "@/lib/utils";

type Video = { id: number; title: string; duration: number };
type Briefing = {
  id: number;
  title: string;
  description: string | null;
  videos: Video[];
};
type Team = {
  id: number;
  name: string;
  project?: { name: string; company?: { id: number; name: string } };
};

export default function BriefingsAdminPage() {
  const [items, setItems] = useState<Briefing[] | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  // Assign-to-team dialog state
  const [assignFor, setAssignFor] = useState<Briefing | null>(null);
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignErr, setAssignErr] = useState<string | undefined>();
  const [assignMsg, setAssignMsg] = useState<string | undefined>();

  async function load() {
    try {
      const [b, v, t] = await Promise.all([
        api.get<Briefing[]>("/api/briefings"),
        api.get<Video[]>("/api/videos"),
        api.get<Team[]>("/api/teams"),
      ]);
      setItems(b);
      setVideos(v);
      setTeams(t);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAssign(b: Briefing) {
    setAssignFor(b);
    setAssignTeamId("");
    setAssignErr(undefined);
    setAssignMsg(undefined);
  }

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignFor) return;
    if (!assignTeamId) {
      setAssignErr("Pick a team");
      return;
    }
    setAssigning(true);
    setAssignErr(undefined);
    setAssignMsg(undefined);
    try {
      const res = await api.post<{ createdForUsers: number[] }>("/api/assignments", {
        briefingId: assignFor.id,
        teamId: Number(assignTeamId),
      });
      const n = res.createdForUsers?.length ?? 0;
      setAssignMsg(
        n === 0
          ? "Team already had this briefing — nothing new assigned."
          : `Assigned to ${n} new team member${n === 1 ? "" : "s"}.`,
      );
    } catch (e) {
      setAssignErr(e instanceof ApiError ? e.message : "Failed to assign");
    } finally {
      setAssigning(false);
    }
  }

  function toggle(id: number) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(undefined);
    try {
      await api.post<Briefing>("/api/briefings", {
        title,
        description: description || undefined,
        videoIds: Array.from(selected),
      });
      setTitle("");
      setDescription("");
      setSelected(new Set());
      setOpen(false);
      load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageBody>
      <PageHeader
        eyebrow="Library / Briefings"
        title="Briefings"
        description="A briefing is a curated bundle of training videos. Workers acknowledge briefings, not individual videos."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4" /> New briefing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compose briefing</DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-5">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Site induction — North entry gate"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    placeholder="What workers will learn; mandatory pre-requisites; expected outcomes."
                  />
                </div>
                <div>
                  <Label>Videos in this briefing</Label>
                  <div className="max-h-72 overflow-y-auto border border-[var(--color-graphite-200)] divide-y divide-[var(--color-graphite-200)]">
                    {videos.length === 0 && (
                      <p className="p-4 text-sm text-[var(--color-graphite-500)]">
                        No videos available. Add some in the Video library first.
                      </p>
                    )}
                    {videos.map((v) => {
                      const checked = selected.has(v.id);
                      return (
                        <label
                          key={v.id}
                          className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--color-graphite-50)]"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(v.id)}
                          />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium">{v.title}</span>
                            <span className="block text-xs font-mono text-[var(--color-graphite-500)]">
                              {formatDuration(v.duration)}
                            </span>
                          </span>
                          <span className="font-mono text-[10px] text-[var(--color-graphite-400)]">
                            #{formatId(v.id)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs font-mono text-[var(--color-graphite-500)]">
                    {selected.size} video{selected.size === 1 ? "" : "s"} selected
                  </p>
                </div>
                <FieldError message={err} />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="accent" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create briefing"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[var(--color-graphite-200)] border border-[var(--color-graphite-200)]">
        {!items && (
          <div className="col-span-full bg-[var(--color-bone)] p-10 text-center text-[var(--color-graphite-500)]">
            Loading…
          </div>
        )}
        {items && items.length === 0 && (
          <div className="col-span-full bg-[var(--color-bone)] p-12 text-center text-[var(--color-graphite-500)]">
            No briefings yet.
          </div>
        )}
        {items?.map((b) => (
          <div
            key={b.id}
            className="bg-[var(--color-bone)] hover:bg-white p-7 transition-colors flex flex-col"
          >
            <Link href={`/briefings/${b.id}`} className="group block">
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)]">
                  #{formatId(b.id)}
                </span>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-graphite-400)] group-hover:text-[var(--color-brand)]" />
              </div>
              <div className="flex items-start gap-3 mb-3">
                <ClipboardList className="h-5 w-5 text-[var(--color-brand)] shrink-0 mt-1" />
                <h3 className="font-display font-bold text-xl leading-tight group-hover:text-[var(--color-brand)] transition-colors">
                  {b.title}
                </h3>
              </div>
              {b.description && (
                <p className="text-sm text-[var(--color-graphite-600)] line-clamp-2 mb-5">
                  {b.description}
                </p>
              )}
            </Link>
            <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-[var(--color-graphite-200)]">
              <span className="font-mono text-[11px] text-[var(--color-graphite-500)]">
                {b.videos.length} video{b.videos.length === 1 ? "" : "s"} ·{" "}
                {formatDuration(b.videos.reduce((s, v) => s + v.duration, 0))}
              </span>
              <Button variant="outline" size="sm" onClick={() => openAssign(b)}>
                <Users className="h-3.5 w-3.5" /> Assign
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign briefing to a team */}
      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign briefing</DialogTitle>
          </DialogHeader>
          {assignFor && (
            <form onSubmit={assign} className="space-y-5">
              <p className="text-sm text-[var(--color-graphite-600)]">
                Assign <strong className="text-[var(--color-ink)]">{assignFor.title}</strong>{" "}
                to every member of a team. Members who already have it are skipped.
              </p>
              <div>
                <Label>Team</Label>
                <Select value={assignTeamId} onValueChange={setAssignTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder={teams.length ? "Pick a team" : "No teams available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                        {t.project?.name ? ` · ${t.project.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {assignErr && <FieldError message={assignErr} />}
              {assignMsg && (
                <p className="flex items-center gap-2 text-sm text-[var(--color-success)]">
                  <CheckCircle2 className="h-4 w-4" /> {assignMsg}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setAssignFor(null)}>
                  {assignMsg ? "Close" : "Cancel"}
                </Button>
                <Button type="submit" variant="accent" disabled={assigning}>
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign to team"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PageBody>
  );
}
