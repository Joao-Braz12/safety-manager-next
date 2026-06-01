"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Users as UsersIcon, Layers } from "lucide-react";
import { api, ApiError, type Role } from "@/lib/api-client";
import { PageBody, PageHeader, TableShell, EmptyRow } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label, FieldError } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { formatId } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = {
  ROLE_USER: "Worker",
  ROLE_PROJECT_LEADER: "Project leader",
  ROLE_COMPANY_ADMIN: "Company admin",
  ROLE_ADMIN: "System admin",
};
const ROLE_RANK: Record<Role, number> = {
  ROLE_USER: 1,
  ROLE_PROJECT_LEADER: 2,
  ROLE_COMPANY_ADMIN: 3,
  ROLE_ADMIN: 4,
};

type Team = { id: number; name: string };
type Project = { id: number; name: string; company?: { id: number; name: string } };
type FullTeam = Team & { project: Project };
type User = {
  id: number;
  fullName: string;
  email: string;
  position: string | null;
  role: Role;
  company?: { id: number; name: string } | null;
  team?: Team | null;
};

export default function UsersPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<User[] | null>(null);
  const [teams, setTeams] = useState<FullTeam[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [editMode, setEditMode] = useState<"role" | "team" | null>(null);
  const [err, setErr] = useState<string | undefined>();

  const callerRank = session ? ROLE_RANK[session.role] : 0;

  async function load() {
    try {
      const [u, t] = await Promise.all([
        api.get<User[]>("/api/users"),
        api.get<FullTeam[]>("/api/teams").catch(() => []),
      ]);
      setItems(u);
      setTeams(t);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <PageBody>
      <PageHeader
        eyebrow="Directory / People"
        title="People"
        description="Roles, teams and access. Role changes respect rank: you can only assign roles below your own."
      />

      {err && <p className="mb-6 text-sm text-[var(--color-acciona-red-deep)]">{err}</p>}

      <TableShell headers={["ID", "Name", "Role", "Team", "Company", "Actions"]}>
        {!items && (
          <tr>
            <td colSpan={6} className="py-10 text-center text-[var(--color-graphite-500)]">
              Loading…
            </td>
          </tr>
        )}
        {items && items.length === 0 && <EmptyRow colSpan={6} message="No users yet." />}
        {items?.map((u) => {
          const canEditRole = ROLE_RANK[u.role] < callerRank;
          return (
            <tr key={u.id} className="hover:bg-[var(--color-graphite-50)]">
              <td className="px-5 py-4 font-mono text-xs text-[var(--color-graphite-600)]">
                {formatId(u.id)}
              </td>
              <td className="px-5 py-4">
                <div className="font-medium">{u.fullName}</div>
                <div className="text-xs text-[var(--color-graphite-500)]">{u.email}</div>
                {u.position && (
                  <div className="text-xs text-[var(--color-graphite-500)] mt-0.5">
                    {u.position}
                  </div>
                )}
              </td>
              <td className="px-5 py-4">
                <RoleBadge role={u.role} />
              </td>
              <td className="px-5 py-4 text-sm">{u.team?.name ?? <span className="text-[var(--color-graphite-400)]">—</span>}</td>
              <td className="px-5 py-4 text-sm text-[var(--color-graphite-600)]">
                {u.company?.name ?? "—"}
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      setEditing(u);
                      setEditMode("team");
                    }}
                  >
                    <Layers className="h-3 w-3" /> Team
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    disabled={!canEditRole}
                    onClick={() => {
                      setEditing(u);
                      setEditMode("role");
                    }}
                  >
                    <ShieldCheck className="h-3 w-3" /> Role
                  </Button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableShell>

      {/* Role change */}
      {editMode === "role" && editing && (
        <RoleDialog
          user={editing}
          callerRank={callerRank}
          onClose={() => {
            setEditing(null);
            setEditMode(null);
          }}
          onSaved={() => {
            setEditing(null);
            setEditMode(null);
            load();
          }}
        />
      )}

      {/* Team change */}
      {editMode === "team" && editing && (
        <TeamDialog
          user={editing}
          teams={teams.filter(
            (t) => !editing.company || t.project?.company?.id === editing.company.id,
          )}
          onClose={() => {
            setEditing(null);
            setEditMode(null);
          }}
          onSaved={() => {
            setEditing(null);
            setEditMode(null);
            load();
          }}
        />
      )}
    </PageBody>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, "outline" | "soft" | "ink" | "accent"> = {
    ROLE_USER: "outline",
    ROLE_PROJECT_LEADER: "soft",
    ROLE_COMPANY_ADMIN: "ink",
    ROLE_ADMIN: "accent",
  };
  return <Badge variant={map[role]}>{ROLE_LABEL[role]}</Badge>;
}

function RoleDialog({
  user,
  callerRank,
  onClose,
  onSaved,
}: {
  user: User;
  callerRank: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  const targetRank = ROLE_RANK[role];
  // Server rule: caller rank > target's current rank AND > new role's rank; ROLE_ADMIN never assignable
  const valid =
    role !== "ROLE_ADMIN" &&
    callerRank > ROLE_RANK[user.role] &&
    callerRank > targetRank;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(undefined);
    try {
      await api.put<User>(`/api/users/${user.id}/role`, { role });
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>{user.fullName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <div>
            <Label>New role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROLE_USER">Worker</SelectItem>
                <SelectItem value="ROLE_PROJECT_LEADER">Project leader</SelectItem>
                <SelectItem value="ROLE_COMPANY_ADMIN">Company admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!valid && (
            <div className="text-xs text-[var(--color-acciona-red-deep)] font-mono">
              ↳ You cannot assign this role (rank rule)
            </div>
          )}
          <FieldError message={err} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={!valid || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamDialog({
  user,
  teams,
  onClose,
  onSaved,
}: {
  user: User;
  teams: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [teamId, setTeamId] = useState<string>(user.team?.id ? String(user.team.id) : "none");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr(undefined);
    try {
      await api.put(`/api/users/${user.id}/team`, {
        teamId: teamId === "none" ? null : Number(teamId),
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign team</DialogTitle>
          <DialogDescription>{user.fullName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-5">
          <div>
            <Label>Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FieldError message={err} />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
