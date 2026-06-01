import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { userTeamSchema } from "@/lib/schemas";
import { badRequest, forbidden, json, notFound } from "@/lib/http";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  if (user.role !== Role.ROLE_ADMIN && user.role !== Role.ROLE_COMPANY_ADMIN) {
    return forbidden("Insufficient role");
  }

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) return badRequest("Invalid user id");

  const body = await req.json().catch(() => null);
  const parsed = userTeamSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid team payload", parsed.error.flatten());

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return notFound("User not found");

  if (user.role === Role.ROLE_COMPANY_ADMIN && target.companyId !== user.companyId) {
    return forbidden("Cross-company access denied");
  }

  if (parsed.data.teamId !== null) {
    const team = await prisma.team.findUnique({
      where: { id: parsed.data.teamId },
      include: { project: true },
    });
    if (!team) return badRequest("Team not found");
    if (
      user.role === Role.ROLE_COMPANY_ADMIN &&
      team.project.companyId !== user.companyId
    ) {
      return forbidden("Cross-company team");
    }
    if (target.companyId && team.project.companyId !== target.companyId) {
      return badRequest("Team belongs to a different company than the user");
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { teamId: parsed.data.teamId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      companyId: true,
      teamId: true,
    },
  });
  return json(updated);
}
