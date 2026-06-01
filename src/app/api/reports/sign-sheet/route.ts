import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json, notFound } from "@/lib/http";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const { searchParams } = new URL(req.url);
  const teamId = Number(searchParams.get("teamId"));
  const briefingId = Number(searchParams.get("briefingId"));
  if (!Number.isInteger(teamId) || !Number.isInteger(briefingId)) {
    return badRequest("teamId and briefingId query params are required");
  }

  const teamAssignment = await prisma.teamAssignment.findUnique({
    where: { teamId_briefingId: { teamId, briefingId } },
    include: {
      assignedBy: { select: { id: true, fullName: true } },
      briefing: {
        include: { videos: { select: { id: true } } },
      },
      team: {
        include: {
          project: { include: { company: { select: { id: true, name: true } } } },
          members: {
            select: {
              id: true,
              fullName: true,
              position: true,
              progress: {
                select: { videoId: true, completed: true },
              },
            },
          },
        },
      },
    },
  });
  if (!teamAssignment) return notFound("Team assignment not found");

  const team = teamAssignment.team;
  if (
    user.role === Role.ROLE_COMPANY_ADMIN &&
    team.project.company.id !== user.companyId
  ) {
    return forbidden("Cross-company access denied");
  }

  const requiredVideoIds = teamAssignment.briefing.videos.map((v) => v.id);

  const signs = team.members.map((m) => {
    const completedSet = new Set(
      m.progress.filter((p) => p.completed).map((p) => p.videoId),
    );
    const completedAll = requiredVideoIds.every((id) => completedSet.has(id));
    return {
      id: m.id,
      name: m.fullName,
      position: m.position,
      completed: completedAll,
    };
  });

  return json({
    companyName: team.project.company.name,
    projectName: team.project.name,
    teamName: team.name,
    adminName: teamAssignment.assignedBy.fullName,
    briefingTitle: teamAssignment.briefing.title,
    assignedAt: teamAssignment.assignedAt,
    signs,
  });
}
