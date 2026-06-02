"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Users as UsersIcon, Layers, ListChecks } from "lucide-react";
import { api, ApiError, type Role } from "@/lib/api-client";
import { PageBody, PageHeader } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Briefing = { id: number; title: string };
type Team = { id: number; name: string; project?: { name: string } };
type User = { id: number; fullName: string; email: string; role: Role; teamId: number | null };

type Mode = "team" | "users";

export default function AssignmentsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [briefingId, setBriefingId] = useState("");
  const [mode, setMode] = useState<Mode>("team");
  const [teamId, setTeamId] = useState("");
  const [userIds, setUserIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const [b, t, u] = await Promise.all([
          api.get<Briefing[]>("/api/briefings"),
          api.get<Team[]>("/api/teams"),
          api.get<User[]>("/api/users"),
        ]);
        setBriefings(b);
        setTeams(t);
        setUsers(u);
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "Failed to load");
      }
    })();
  }, []);

  const teamUsers = useMemo(
    () => (teamId ? users.filter((u) => u.teamId === Number(teamId)) : []),
    [users, teamId],
  );

  function toggleUser(id: number) {
    setUserIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!briefingId) {
      setErr("Pick a briefing");
      return;
    }
    setSubmitting(true);
    setErr(undefined);
    setDone(null);
    try {
      const payload: { briefingId: number; teamId?: number; userIds?: number[] } = {
        briefingId: Number(briefingId),
      };
      if (mode === "team") {
        if (!teamId) {
          setErr("Pick a team");
          setSubmitting(false);
          return;
        }
        payload.teamId = Number(teamId);
      } else {
        if (userIds.size === 0) {
          setErr("Select at least one user");
          setSubmitting(false);
          return;
        }
        payload.userIds = Array.from(userIds);
      }
      const result = await api.post<{ createdForUsers: number[] }>(
        "/api/assignments",
        payload,
      );
      setDone(
        `Assigned to ${result.createdForUsers.length} user${result.createdForUsers.length === 1 ? "" : "s"}.`,
      );
      setUserIds(new Set());
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to assign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageBody>
      <PageHeader
        eyebrow="Workflow / Assignments"
        title={
          <>
            Push a briefing
            <br />
            <span className="text-[var(--color-brand)]">to your crew.</span>
          </>
        }
        description="Assign to an entire team in one action, or pick individuals one by one. Existing assignments are not duplicated."
      />

      <div className="grid grid-cols-12 gap-8">
        {/* Composer */}
        <section className="col-span-12 lg:col-span-8">
          <div className="bg-white border border-[var(--color-graphite-200)] p-8 space-y-7">
            {/* Step 1: briefing */}
            <Step number="01" label="Briefing">
              <Select value={briefingId} onValueChange={setBriefingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a briefing" />
                </SelectTrigger>
                <SelectContent>
                  {briefings.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      #{b.id} · {b.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Step>

            {/* Step 2: target */}
            <Step number="02" label="Target">
              <div className="flex gap-px bg-[var(--color-graphite-200)] mb-5">
                <button
                  type="button"
                  onClick={() => setMode("team")}
                  className={`flex-1 px-4 py-3 text-sm font-medium inline-flex items-center justify-center gap-2 ${
                    mode === "team"
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-white hover:bg-[var(--color-graphite-50)]"
                  }`}
                >
                  <Layers className="h-4 w-4" /> Whole team
                </button>
                <button
                  type="button"
                  onClick={() => setMode("users")}
                  className={`flex-1 px-4 py-3 text-sm font-medium inline-flex items-center justify-center gap-2 ${
                    mode === "users"
                      ? "bg-[var(--color-ink)] text-white"
                      : "bg-white hover:bg-[var(--color-graphite-50)]"
                  }`}
                >
                  <UsersIcon className="h-4 w-4" /> Individuals
                </button>
              </div>

              {mode === "team" ? (
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a team" />
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
              ) : (
                <div className="max-h-72 overflow-y-auto border border-[var(--color-graphite-200)] divide-y divide-[var(--color-graphite-200)]">
                  {users.length === 0 && (
                    <p className="p-4 text-sm text-[var(--color-graphite-500)]">
                      No users available.
                    </p>
                  )}
                  {users.map((u) => {
                    const checked = userIds.has(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--color-graphite-50)]"
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleUser(u.id)} />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium">{u.fullName}</span>
                          <span className="block text-xs text-[var(--color-graphite-500)]">
                            {u.email}
                          </span>
                        </span>
                        <Badge variant="outline">{u.role.replace("ROLE_", "")}</Badge>
                      </label>
                    );
                  })}
                </div>
              )}
            </Step>

            <FieldError message={err} />
            {done && (
              <div className="px-4 py-3 bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-sm text-[var(--color-success)] font-mono">
                ✓ {done}
              </div>
            )}

            <div className="pt-3 border-t border-[var(--color-graphite-200)] flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
                {mode === "team"
                  ? `${teamUsers.length} member${teamUsers.length === 1 ? "" : "s"} affected`
                  : `${userIds.size} user${userIds.size === 1 ? "" : "s"} selected`}
              </div>
              <Button onClick={submit} variant="accent" disabled={submitting}>
                {submitting ? (
                  <>
                    Assigning
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    Push assignment <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Side panel: preview */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="bg-[var(--color-ink)] text-white p-7 relative overflow-hidden">
            <div className="noise" />
            <ListChecks className="h-8 w-8 text-[var(--color-brand)] mb-5" />
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55 mb-2">
              Live preview
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              {briefingId
                ? `Briefing #${briefingId} will be pushed to ${
                    mode === "team"
                      ? teamId
                        ? `team #${teamId} (${teamUsers.length} members)`
                        : "a team you select"
                      : `${userIds.size} individuals`
                  }.`
                : "Select a briefing to see who will be notified."}
            </p>
            <div className="mt-6 h-px bg-white/15" />
            <ul className="mt-6 space-y-3 text-sm text-white/70">
              <li>Existing assignments are not duplicated.</li>
              <li>Workers see the briefing on their dashboard immediately.</li>
              <li>Acknowledgement is required per individual.</li>
            </ul>
          </div>
        </aside>
      </div>
    </PageBody>
  );
}

function Step({
  number,
  label,
  children,
}: {
  number: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--color-brand)]">
          {number}
        </span>
        <Label className="mb-0">{label}</Label>
      </div>
      {children}
    </div>
  );
}
