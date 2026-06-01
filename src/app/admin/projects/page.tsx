"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus, Briefcase, Loader2, ChevronRight, ChevronDown, Layers } from "lucide-react";
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
import { useAuth } from "@/components/auth-provider";
import { formatId } from "@/lib/utils";

type Company = { id: number; name: string };
type Project = { id: number; name: string; company: Company; companyId: number };
type TeamRow = { id: number; name: string };

export default function ProjectsPage() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<Project[] | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const teams = useDrilldown<TeamRow>((projectId) =>
    api.get<TeamRow[]>(`/api/teams?projectId=${projectId}`),
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const list = await api.get<Project[]>("/api/projects");
      setItems(list);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
    if (hasRole("ROLE_ADMIN")) {
      api.get<Company[]>("/api/companies").then(setCompanies).catch(() => {});
    }
  }, [hasRole]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(undefined);
    try {
      const payload: { name: string; companyId?: number } = { name };
      if (hasRole("ROLE_ADMIN")) {
        if (!companyId) {
          setErr("Pick a company");
          setSubmitting(false);
          return;
        }
        payload.companyId = Number(companyId);
      }
      await api.post<Project>("/api/projects", payload);
      setName("");
      setCompanyId("");
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
        eyebrow="Directory / Projects"
        title="Projects"
        description="A project groups one or more teams under a single company."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add project</DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-5">
                <div>
                  <Label htmlFor="name">Project name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Lisbon Bridge Refit"
                  />
                </div>
                {hasRole("ROLE_ADMIN") && (
                  <div>
                    <Label>Company</Label>
                    <Select value={companyId} onValueChange={setCompanyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a company" />
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
                )}
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

      <TableShell headers={["ID", "Project", "Company"]}>
        {!items && (
          <tr>
            <td colSpan={3} className="py-10 text-center text-[var(--color-graphite-500)]">
              Loading…
            </td>
          </tr>
        )}
        {items && items.length === 0 && <EmptyRow colSpan={3} message="No projects yet." />}
        {items?.map((p) => {
          const expanded = teams.expandedId === p.id;
          const list = teams.cache.get(p.id);
          return (
            <Fragment key={p.id}>
              <tr
                className="hover:bg-[var(--color-graphite-50)] cursor-pointer"
                onClick={() => teams.toggle(p.id)}
              >
                <td className="px-5 py-4 font-mono text-xs text-[var(--color-graphite-600)]">
                  {formatId(p.id)}
                </td>
                <td className="px-5 py-4 flex items-center gap-3">
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-[var(--color-acciona-red)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--color-graphite-400)]" />
                  )}
                  <Briefcase className="h-4 w-4 text-[var(--color-graphite-400)]" />
                  <span className="font-medium">{p.name}</span>
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-graphite-600)]">
                  {p.company?.name ?? "—"}
                </td>
              </tr>
              {expanded && (
                <ExpandedCell colSpan={3}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)] mb-3">
                    Teams{list ? ` · ${list.length}` : ""}
                  </div>
                  {teams.loadingId === p.id && !list ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-graphite-500)]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading teams…
                    </div>
                  ) : list && list.length > 0 ? (
                    <ul className="space-y-2">
                      {list.map((t) => (
                        <li key={t.id} className="flex items-center gap-3 text-sm">
                          <Layers className="h-3.5 w-3.5 text-[var(--color-graphite-400)]" />
                          <span className="font-medium">{t.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--color-graphite-500)]">
                      No teams in this project yet.
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
