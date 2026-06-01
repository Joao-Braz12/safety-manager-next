"use client";

import { useEffect, useState } from "react";
import { FileSignature, Loader2, ShieldCheck, X, Printer } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import {
  PageBody,
  PageHeader,
  DataCard,
  TableShell,
  EmptyRow,
} from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT, useLocale, intlLocale } from "@/i18n";
import { formatDateTime } from "@/lib/utils";

type Report = { totalAssigned: number; completed: number; pending: number };
type Team = { id: number; name: string; project?: { name: string; company?: { id: number; name: string } } };
type TeamBriefing = { briefingId: number; title: string; assignedAt: string };
type SignSheet = {
  companyName: string;
  projectName: string;
  teamName: string;
  adminName: string;
  briefingTitle: string;
  assignedAt: string;
  signs: { id: number; name: string; position: string | null; completed: boolean }[];
};
type Individual = {
  id: number;
  status: "PENDING" | "COMPLETED";
  assignedAt: string;
  user: { id: number; fullName: string; position: string | null };
  briefing: { id: number; title: string };
};

type Tab = "team" | "individuals";

export default function ReportsPage() {
  const t = useT();
  const [report, setReport] = useState<Report | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<Tab>("team");

  useEffect(() => {
    api.get<Report>("/api/reports").then(setReport).catch(() => {});
    api.get<Team[]>("/api/teams").then(setTeams).catch(() => {});
  }, []);

  const rate = report
    ? Math.round((report.completed / Math.max(1, report.totalAssigned)) * 100)
    : 0;

  return (
    <PageBody>
      <PageHeader
        eyebrow={t("reports.eyebrow")}
        title={t("reports.title")}
        description={t("reports.description")}
      />

      {/* KPI strip */}
      {report && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[var(--color-graphite-200)] mb-10 reveal">
          <DataCard label={t("reports.total")} value={report.totalAssigned} hint={t("reports.totalHint")} />
          <DataCard label={t("reports.completed")} value={report.completed} hint={t("reports.completedHint")} accent />
          <DataCard label={t("reports.pending")} value={report.pending} hint={t("reports.pendingHint")} />
          <DataCard label={t("reports.rate")} value={`${rate}%`} hint={t("reports.rateHint")} />
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[var(--color-graphite-200)] reveal reveal-2">
        <TabButton active={tab === "team"} onClick={() => setTab("team")}>
          {t("reports.tabTeam")}
        </TabButton>
        <TabButton active={tab === "individuals"} onClick={() => setTab("individuals")}>
          {t("reports.tabIndividuals")}
        </TabButton>
      </div>

      {tab === "team" ? (
        <TeamSignSheet teams={teams} />
      ) : (
        <IndividualsLedger teams={teams} />
      )}
    </PageBody>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-[var(--color-ink)]"
          : "text-[var(--color-graphite-500)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-px left-3 right-3 h-[2px] bg-[var(--color-acciona-red)]" />
      )}
    </button>
  );
}

/* ------------------------------- Team sign sheet ------------------------------- */

function TeamSignSheet({ teams }: { teams: Team[] }) {
  const t = useT();
  const { locale } = useLocale();
  const [teamId, setTeamId] = useState("");
  const [briefingId, setBriefingId] = useState("");
  const [teamBriefings, setTeamBriefings] = useState<TeamBriefing[] | null>(null);
  const [sheet, setSheet] = useState<SignSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  // When the team changes, load only the briefings assigned to that team.
  useEffect(() => {
    setBriefingId("");
    setTeamBriefings(null);
    if (!teamId) return;
    api
      .get<TeamBriefing[]>(`/api/teams/${teamId}/assignments`)
      .then(setTeamBriefings)
      .catch(() => setTeamBriefings([]));
  }, [teamId]);

  async function fetchSheet() {
    if (!briefingId || !teamId) {
      setErr(t("reports.pickBoth"));
      return;
    }
    setLoading(true);
    setErr(undefined);
    try {
      const data = await api.get<SignSheet>(
        `/api/reports/sign-sheet?teamId=${teamId}&briefingId=${briefingId}`,
      );
      setSheet(data);
    } catch (e) {
      setSheet(null);
      setErr(e instanceof ApiError ? e.message : t("reports.sheetLoadFailed"));
    } finally {
      setLoading(false);
    }
  }

  const noBriefings = teamId && teamBriefings && teamBriefings.length === 0;

  return (
    <>
      <section className="mb-12 reveal">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-4 pb-3 border-b border-[var(--color-ink)]">
          {t("reports.signSheetOnDemand")}
        </div>

        <div className="bg-white border border-[var(--color-graphite-200)] p-7 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-5 items-end">
          <div>
            <Label>{t("reports.team")}</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger>
                <SelectValue placeholder={t("reports.pickTeam")} />
              </SelectTrigger>
              <SelectContent>
                {teams.map((tm) => (
                  <SelectItem key={tm.id} value={String(tm.id)}>
                    {tm.name} · {tm.project?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("reports.briefing")}</Label>
            <Select value={briefingId} onValueChange={setBriefingId} disabled={!teamId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={teamId ? t("reports.pickBriefing") : t("reports.pickTeamFirst")}
                />
              </SelectTrigger>
              <SelectContent>
                {(teamBriefings ?? []).map((b) => (
                  <SelectItem key={b.briefingId} value={String(b.briefingId)}>
                    #{b.briefingId} · {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchSheet} variant="primary" disabled={loading || !briefingId}>
            {loading ? (
              <>
                {t("reports.generating")}
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                {t("common.generate")} <FileSignature className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {noBriefings && (
          <p className="mt-4 text-sm text-[var(--color-graphite-500)]">
            {t("reports.noTeamBriefings")}
          </p>
        )}
        {err && <p className="mt-4 text-sm text-[var(--color-acciona-red-deep)]">{err}</p>}
      </section>

      {sheet && (
        <section className="reveal reveal-3">
          <div className="print-area bg-white border border-[var(--color-ink)] p-8 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-[var(--color-ink)]">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-graphite-500)] mb-3">
                  {t("reports.auditSignSheet")}
                </div>
                <h2 className="font-display font-black text-3xl tracking-tight">
                  {sheet.briefingTitle}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-graphite-600)]">
                  {sheet.companyName} · {sheet.projectName} · {sheet.teamName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 print:hidden">
                <Button onClick={() => window.print()} variant="outline" size="sm">
                  <Printer className="h-3.5 w-3.5" /> {t("common.print")}
                </Button>
                <button
                  type="button"
                  onClick={() => setSheet(null)}
                  className="text-xs text-[var(--color-graphite-500)] hover:text-[var(--color-acciona-red)] inline-flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> {t("common.close")}
                </button>
              </div>
            </div>

            {/* Meta */}
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-graphite-200)] mb-8">
              <Meta label={t("reports.assignedBy")} value={sheet.adminName} />
              <Meta
                label={t("reports.assignedAt")}
                value={formatDateTime(sheet.assignedAt, intlLocale(locale))}
                mono
              />
              <Meta label={t("reports.teamSize")} value={String(sheet.signs.length)} />
              <Meta
                label={t("reports.acknowledged")}
                value={`${sheet.signs.filter((s) => s.completed).length}/${sheet.signs.length}`}
                mono
              />
            </dl>

            {/* Roster */}
            <ol className="border border-[var(--color-graphite-300)] divide-y divide-[var(--color-graphite-300)]">
              {sheet.signs.map((s, i) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 px-5 py-4 print:break-inside-avoid"
                >
                  <span className="font-mono text-xs text-[var(--color-graphite-500)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{s.name}</span>
                    {s.position && (
                      <span className="block text-xs text-[var(--color-graphite-500)]">
                        {s.position}
                      </span>
                    )}
                  </span>
                  {s.completed ? (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-success)]">
                      <ShieldCheck className="h-3.5 w-3.5" /> {t("common.signed")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-acciona-red-deep)]">
                      <X className="h-3.5 w-3.5" /> {t("common.pending")}
                    </span>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--color-graphite-500)] flex justify-between">
              <span>ISO 45001 · Acciona Safety Manager</span>
              <span>{t("reports.generated")} · {formatDateTime(new Date(), intlLocale(locale))}</span>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ------------------------------- Individuals ledger ------------------------------- */

function IndividualsLedger({ teams }: { teams: Team[] }) {
  const t = useT();
  const [teamId, setTeamId] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Individual[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (teamId) params.set("teamId", teamId);
    if (status) params.set("status", status);
    const qs = params.toString();
    setRows(null);
    api
      .get<Individual[]>(`/api/assignments${qs ? `?${qs}` : ""}`)
      .then(setRows)
      .catch(() => setRows([]));
  }, [teamId, status]);

  return (
    <section className="reveal">
      <div className="bg-white border border-[var(--color-graphite-200)] p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-5 mb-6">
        <div>
          <Label>{t("reports.team")}</Label>
          <Select value={teamId || "all"} onValueChange={(v) => setTeamId(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder={t("reports.allTeams")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.allTeams")}</SelectItem>
              {teams.map((tm) => (
                <SelectItem key={tm.id} value={String(tm.id)}>
                  {tm.name} · {tm.project?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("common.status")}</Label>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder={t("reports.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("reports.allStatuses")}</SelectItem>
              <SelectItem value="PENDING">{t("common.pending")}</SelectItem>
              <SelectItem value="COMPLETED">{t("common.completed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TableShell
        headers={[t("reports.worker"), t("reports.position"), t("reports.briefing"), t("common.status")]}
      >
        {!rows && (
          <tr>
            <td colSpan={4} className="py-10 text-center text-[var(--color-graphite-500)]">
              {t("common.loading")}
            </td>
          </tr>
        )}
        {rows && rows.length === 0 && (
          <EmptyRow colSpan={4} message={t("reports.noIndividuals")} />
        )}
        {rows?.map((r) => (
          <tr key={r.id} className="hover:bg-[var(--color-graphite-50)]">
            <td className="px-5 py-4 text-sm font-medium">{r.user.fullName}</td>
            <td className="px-5 py-4 text-sm text-[var(--color-graphite-600)]">
              {r.user.position ?? t("common.dash")}
            </td>
            <td className="px-5 py-4 text-sm text-[var(--color-graphite-600)]">
              {r.briefing.title}
            </td>
            <td className="px-5 py-4">
              {r.status === "COMPLETED" ? (
                <Badge variant="success">
                  <ShieldCheck className="h-2.5 w-2.5" /> {t("common.signed")}
                </Badge>
              ) : (
                <Badge variant="accent">{t("common.pending")}</Badge>
              )}
            </td>
          </tr>
        ))}
      </TableShell>
    </section>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white p-4">
      <dt className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--color-graphite-500)] mb-1">
        {label}
      </dt>
      <dd className={`text-sm ${mono ? "font-mono" : "font-medium"}`}>{value}</dd>
    </div>
  );
}
