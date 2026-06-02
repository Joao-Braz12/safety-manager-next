import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { sendPendingReminders } from "@/lib/reminders";
import { forbidden, json } from "@/lib/http";

// Admin-on-demand trigger for the same digest the cron sends. Company admins
// are scoped to their own company; global admins reach everyone.
export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  if (user.role !== Role.ROLE_ADMIN && user.role !== Role.ROLE_COMPANY_ADMIN) {
    return forbidden("Admin only");
  }

  const companyId =
    user.role === Role.ROLE_COMPANY_ADMIN && user.companyId ? user.companyId : undefined;

  const result = await sendPendingReminders({ companyId });
  return json(result);
}
