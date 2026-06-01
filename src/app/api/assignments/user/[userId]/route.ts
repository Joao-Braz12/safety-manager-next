import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json, notFound } from "@/lib/http";

export async function GET(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const { userId } = await ctx.params;
  const targetId = Number(userId);
  if (!Number.isInteger(targetId)) return badRequest("Invalid user id");

  if (user.role === Role.ROLE_USER && user.id !== targetId) {
    return forbidden("Cannot view another user's assignments");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return notFound("User not found");

  if (
    user.role === Role.ROLE_COMPANY_ADMIN &&
    target.companyId !== user.companyId
  ) {
    return forbidden("Cross-company access denied");
  }

  const assignments = await prisma.assignment.findMany({
    where: { userId: targetId },
    include: { briefing: { include: { videos: true } } },
    orderBy: { assignedAt: "desc" },
  });
  return json(assignments);
}
