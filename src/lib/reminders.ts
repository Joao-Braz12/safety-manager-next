import { AssignmentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { sendEmail } from "./email";

export type ReminderResult = { sent: number; skipped: number; failed: number };

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDigest(fullName: string, briefingTitles: string[]): string {
  const items = briefingTitles
    .map((t) => `<li style="margin:4px 0;">${escapeHtml(t)}</li>`)
    .join("");
  const count = briefingTitles.length;
  const plural = count === 1 ? "briefing" : "briefings";
  return `<!doctype html>
<html>
  <body style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;line-height:1.5;">
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>You still have <strong>${count} safety ${plural}</strong> to complete:</p>
    <ul style="padding-left:18px;">${items}</ul>
    <p>
      <a href="${APP_URL}/dashboard"
         style="display:inline-block;background:#0b5;color:#fff;text-decoration:none;
                padding:10px 18px;border-radius:4px;font-weight:bold;">
        Watch now
      </a>
    </p>
    <p style="color:#666;font-size:13px;">
      Log in with your work email to view and complete your assigned briefings.
    </p>
  </body>
</html>`;
}

/**
 * Find every user with PENDING assignments and email each one a single digest
 * listing the briefings they still need to complete. Optionally scope to a
 * single company (used by the admin manual trigger).
 */
export async function sendPendingReminders(opts: { companyId?: number } = {}): Promise<ReminderResult> {
  const assignments = await prisma.assignment.findMany({
    where: {
      status: AssignmentStatus.PENDING,
      ...(opts.companyId ? { user: { companyId: opts.companyId } } : {}),
    },
    select: {
      user: { select: { id: true, email: true, fullName: true } },
      briefing: { select: { title: true } },
    },
  });

  // Group pending briefings by user.
  const byUser = new Map<number, { email: string; fullName: string; titles: string[] }>();
  for (const a of assignments) {
    const entry = byUser.get(a.user.id) ?? {
      email: a.user.email,
      fullName: a.user.fullName,
      titles: [],
    };
    entry.titles.push(a.briefing.title);
    byUser.set(a.user.id, entry);
  }

  const result: ReminderResult = { sent: 0, skipped: 0, failed: 0 };

  for (const { email, fullName, titles } of byUser.values()) {
    if (!email) {
      result.skipped += 1;
      continue;
    }
    const res = await sendEmail({
      to: email,
      subject: `Reminder: ${titles.length} safety ${titles.length === 1 ? "briefing" : "briefings"} to complete`,
      html: renderDigest(fullName, titles),
    });
    if (res.ok) result.sent += 1;
    else if (res.skipped) result.skipped += 1;
    else result.failed += 1;
  }

  return result;
}
