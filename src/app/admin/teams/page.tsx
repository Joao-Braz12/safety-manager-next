"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus, Layers, Loader2, ChevronRight, ChevronDown, User2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useDrilldown } from "@/lib/use-drilldown";
import { PageBody, PageHeader, TableShell, EmptyRow, ExpandedCell } from "@/components/admin-shell";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatId } from "@/lib/utils";

type Project = { id: number; name: string; company: { name: string } };
type Team = { id: number; name: string; project: Project };
type Member = { id: number; fullName: string; position: string | null };

export default function TeamsPage() {
  const [items, setItems] = useState<Team[] | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const members = useDrilldown<Member>((teamId) =>
    api.get<Member[]>(`/api/users?teamId=${teamId}`),
  );

  async function load() {
    try {
      const [t, p] = await Promise.all([
        api.get<Team[]>("/api/teams"),
        api.get<Project[]>("/api/projects"),
      ]);
      setItems(t);
      setProjects(p);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setErr("Select a project");
      return;
    }
    setSubmitting(true);
    setErr(undefined);
    try {
      await api.post<Team>("/api/teams", {
        name,
        projectId: Number(projectId),
      });
      setName("");
      setProjectId("");
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
        eyebrow="Directory / Teams"
        title="Teams"
        description="Crews and shifts. Briefings can be assigned to a whole team in one action."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4" /> New team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add team</DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-5">
                <div>
                  <Label htmlFor="name">Team name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Night shift / Tower A"
                  />
                </div>
                <div>
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name} · {p.company?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FieldError message={err} />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="accent" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <TableShell headers={["ID", "Team", "Project", "Company"]}>
        {!items && (
          <tr>
            <td colSpan={4} className="py-10 text-center text-[var(--color-graphite-500)]">
              Loading…
            </td>
          </tr>
        )}
        {items && items.length === 0 && <EmptyRow colSpan={4} message="No teams yet." />}
        {items?.map((t) => {
          const expanded = members.expandedId === t.id;
          const list = members.cache.get(t.id);
          return (
            <Fragment key={t.id}>
              <tr
                className="hover:bg-[var(--color-graphite-50)] cursor-pointer"
                onClick={() => members.toggle(t.id)}
              >
                <td className="px-5 py-4 font-mono text-xs text-[var(--color-graphite-600)]">
                  {formatId(t.id)}
                </td>
                <td className="px-5 py-4 flex items-center gap-3">
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-[var(--color-brand)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--color-graphite-400)]" />
                  )}
                  <Layers className="h-4 w-4 text-[var(--color-graphite-400)]" />
                  <span className="font-medium">{t.name}</span>
                </td>
                <td className="px-5 py-4 text-sm">{t.project?.name}</td>
                <td className="px-5 py-4 text-sm text-[var(--color-graphite-600)]">
                  {t.project?.company?.name}
                </td>
              </tr>
              {expanded && (
                <ExpandedCell colSpan={4}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)] mb-3">
                    Members{list ? ` · ${list.length}` : ""}
                  </div>
                  {members.loadingId === t.id && !list ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-graphite-500)]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
                    </div>
                  ) : list && list.length > 0 ? (
                    <ul className="space-y-2">
                      {list.map((m) => (
                        <li key={m.id} className="flex items-center gap-3 text-sm">
                          <User2 className="h-3.5 w-3.5 text-[var(--color-graphite-400)]" />
                          <span className="font-medium">{m.fullName}</span>
                          {m.position && (
                            <span className="text-[var(--color-graphite-500)]">
                              · {m.position}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--color-graphite-500)]">
                      No members in this team yet.
                    </p>
                  )}
                </ExpandedCell>
              )}
            </Fragment>
          );
        })}
      </TableShell>
    </PageBody>
  );
}
