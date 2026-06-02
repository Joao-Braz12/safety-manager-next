import type { NextRequest } from "next/server";
import { sendPendingReminders } from "@/lib/reminders";
import { json, unauthorized } from "@/lib/http";

// Secret-guarded endpoint hit by Vercel Cron. The middleware allowlists
// /api/cron/* and skips JWT, so this route enforces its own auth via CRON_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return unauthorized("Invalid cron secret");
  }

  const result = await sendPendingReminders();
  return json(result);
}
