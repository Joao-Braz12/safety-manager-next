"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus, Building2, Loader2, ChevronRight, ChevronDown, Briefcase } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useDrilldown } from "@/lib/use-drilldown";
import { PageBody, PageHeader, TableShell, EmptyRow, ExpandedCell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Label, FieldError } from "@/components/ui/input";
import { formatId } from "@/lib/utils";

type Company = { id: number; name: string };
type ProjectRow = { id: number; name: string };

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[] | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const projects = useDrilldown<ProjectRow>((companyId) =>
    api.get<ProjectRow[]>(`/api/projects?companyId=${companyId}`),
  );

  async function load() {
    try {
      const list = await api.get<Company[]>("/api/companies");
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
      await api.post<Company>("/api/companies", { name });
      setName("");
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
        eyebrow="Directory / Companies"
        title="Companies"
        description="Top-level tenants. Each user, project and team belongs to a company."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4" /> New company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add company</DialogTitle>
                <DialogDescription>
                  Companies are visible in the registration dropdown.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={create}>
                <Label htmlFor="name">Company name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Construction"
                />
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

      <TableShell headers={["ID", "Name", ""]}>
        {!items && (
          <tr>
            <td colSpan={3} className="py-10 text-center text-[var(--color-graphite-500)]">
              Loading…
            </td>
          </tr>
        )}
        {items && items.length === 0 && (
          <EmptyRow colSpan={3} message="No companies yet — add the first one." />
        )}
        {items?.map((c) => {
          const expanded = projects.expandedId === c.id;
          const list = projects.cache.get(c.id);
          return (
            <Fragment key={c.id}>
              <tr
                className="hover:bg-[var(--color-graphite-50)] cursor-pointer"
                onClick={() => projects.toggle(c.id)}
              >
                <td className="px-5 py-4 font-mono text-xs text-[var(--color-graphite-600)]">
                  {formatId(c.id)}
                </td>
                <td className="px-5 py-4 flex items-center gap-3">
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-[var(--color-brand)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[var(--color-graphite-400)]" />
                  )}
                  <Building2 className="h-4 w-4 text-[var(--color-graphite-400)]" />
                  <span className="font-medium">{c.name}</span>
                </td>
                <td className="px-5 py-4" />
              </tr>
              {expanded && (
                <ExpandedCell colSpan={3}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)] mb-3">
                    Projects{list ? ` · ${list.length}` : ""}
                  </div>
                  {projects.loadingId === c.id && !list ? (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-graphite-500)]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
                    </div>
                  ) : list && list.length > 0 ? (
                    <ul className="space-y-2">
                      {list.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 text-sm">
                          <Briefcase className="h-3.5 w-3.5 text-[var(--color-graphite-400)]" />
                          <span className="font-medium">{p.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[var(--color-graphite-500)]">
                      No projects in this company yet.
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
