"use client";

import { ShieldAlert } from "lucide-react";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { RISK_TAXONOMY, groupOf, groupKey, subKey } from "@/lib/risk-taxonomy";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Sentinel value for "no category" / "all" — Radix Select can't use "". */
export const RISK_NONE = "__none__";
export const RISK_ALL = "__all__";

/** Builds "1.1 · Falls from height" using the active locale. */
export function useRiskLabel() {
  const t = useT();
  return (code: string | null | undefined): string | null => {
    if (!code) return null;
    return `${code} · ${t(subKey(code))}`;
  };
}

/** Small chip showing a video's risk subcategory. Renders nothing if unset. */
export function RiskBadge({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const label = useRiskLabel()(code);
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
        "bg-[var(--color-brand-soft)] text-[var(--color-brand-deep)]",
        className,
      )}
    >
      <ShieldAlert className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

/**
 * Grouped risk-category picker. `value` is a subcategory code, or RISK_NONE.
 * Pass `includeNone` to offer an "Uncategorized" option.
 */
export function RiskCategorySelect({
  value,
  onChange,
  includeNone = true,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  includeNone?: boolean;
  className?: string;
}) {
  const t = useT();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={t("risk.select")} />
      </SelectTrigger>
      <SelectContent className="max-h-[60vh]">
        {includeNone && <SelectItem value={RISK_NONE}>{t("risk.none")}</SelectItem>}
        {RISK_TAXONOMY.map((g) => (
          <SelectGroup key={g.code}>
            <SelectLabel>
              {g.code}. {t(groupKey(g.code))}
            </SelectLabel>
            {g.subs.map((code) => (
              <SelectItem key={code} value={code}>
                {code} · {t(subKey(code))}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Group-level filter (All + the 9 groups). `value` is a group code or RISK_ALL.
 */
export function RiskGroupFilter({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const t = useT();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={t("risk.all")} />
      </SelectTrigger>
      <SelectContent className="max-h-[60vh]">
        <SelectItem value={RISK_ALL}>{t("risk.all")}</SelectItem>
        {RISK_TAXONOMY.map((g) => (
          <SelectItem key={g.code} value={g.code}>
            {g.code}. {t(groupKey(g.code))}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** True when a video's subcategory code belongs to the given group code. */
export function matchesGroup(code: string | null | undefined, groupCode: string): boolean {
  return !!code && groupOf(code) === groupCode;
}
