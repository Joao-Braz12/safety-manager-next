import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json, notFound } from "@/lib/http";

// Briefings that have been assigned to this team (i.e. have a TeamAssignment).
// Powers the team-filtered briefing dropdown on the Reports page.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const { id } = await ctx.params;
  const teamId = Number(id);
  if (!Number.isInteger(teamId)) return badRequest("Invalid team id");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { project: { select: { companyId: true } } },
  });
  if (!team) return notFound("Team not found");

  if (
    user.role === Role.ROLE_COMPANY_ADMIN &&
    team.project.companyId !== user.companyId
  ) {
    return forbidden("Cross-company access denied");
  }

  const teamAssignments = await prisma.teamAssignment.findMany({
    where: { teamId },
    include: { briefing: { select: { id: true, title: true } } },
    orderBy: { assignedAt: "desc" },
  });

  return json(
    teamAssignments.map((ta) => ({
      briefingId: ta.briefingId,
      title: ta.briefing.title,
      assignedAt: ta.assignedAt,
    })),
  );
}
