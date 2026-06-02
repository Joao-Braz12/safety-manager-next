// Fixed occupational-risk taxonomy (9 groups → subcategories).
// Codes are stable identifiers; human labels live in the i18n dictionaries
// under `risk.groups.<groupCode>` and `risk.subs.<subCode with . -> _>`.
// A Video carries at most one subcategory code (Video.riskCategory, e.g. "1.1").

export type RiskGroup = { code: string; subs: string[] };

export const RISK_TAXONOMY: RiskGroup[] = [
  { code: "1", subs: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"] },
  { code: "2", subs: ["2.1", "2.2", "2.3"] },
  { code: "3", subs: ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7"] },
  { code: "4", subs: ["4.1", "4.2", "4.3", "4.4", "4.5"] },
  { code: "5", subs: ["5.1", "5.2", "5.3", "5.4"] },
  { code: "6", subs: ["6.1", "6.2", "6.3"] },
  { code: "7", subs: ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"] },
  { code: "8", subs: ["8.1", "8.2", "8.3"] },
  { code: "9", subs: ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6"] },
];

/** All valid subcategory codes (e.g. "1.1"), for validation. */
export const RISK_SUB_CODES: string[] = RISK_TAXONOMY.flatMap((g) => g.subs);
const SUB_CODE_SET = new Set(RISK_SUB_CODES);

export function isRiskSubCode(code: string): boolean {
  return SUB_CODE_SET.has(code);
}

/** Returns the parent group code for a subcategory code, or null. */
export function groupOf(subCode: string): string | null {
  return RISK_TAXONOMY.find((g) => g.subs.includes(subCode))?.code ?? null;
}

/** i18n key for a group label, e.g. groupKey("1") -> "risk.groups.1". */
export function groupKey(code: string): string {
  return `risk.groups.${code}`;
}

/** i18n key for a subcategory label, e.g. subKey("1.1") -> "risk.subs.1_1". */
export function subKey(code: string): string {
  return `risk.subs.${code.replace(/\./g, "_")}`;
}
