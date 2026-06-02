import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Safety Manager <onboarding@resend.dev>";

// Lazy singleton so a missing key never crashes module load (mirrors the
// defensive posture in lib/auth.ts). Dev/local without a key simply no-ops.
let client: Resend | null = null;
function getClient(): Resend | null {
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export type SendEmailArgs = { to: string; subject: string; html: string };

export type SendResult = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<SendResult> {
  const resend = getClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to} ("${subject}")`);
    return { ok: false, skipped: true };
  }
  try {
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error(`[email] failed to send to ${to}:`, error);
      return { ok: false, error: String(error.message ?? error) };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[email] threw sending to ${to}:`, e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
