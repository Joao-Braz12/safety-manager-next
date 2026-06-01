import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { AssignmentStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assignmentSchema } from "@/lib/schemas";
import { badRequest, forbidden, json } from "@/lib/http";

// Per-individual assignment ledger for the Reports → Individuals tab.
// Optional filters: ?teamId= ?briefingId= ?status=PENDING|COMPLETED
export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  if (user.role === Role.ROLE_USER) return forbidden("Insufficient role");

  const sp = req.nextUrl.searchParams;
  const teamId = sp.get("teamId") ? Number(sp.get("teamId")) : undefined;
  const briefingId = sp.get("briefingId") ? Number(sp.get("briefingId")) : undefined;
  const statusParam = sp.get("status");

  const userWhere: Prisma.UserWhereInput = {};
  if (user.role === Role.ROLE_COMPANY_ADMIN && user.companyId) {
    userWhere.companyId = user.companyId;
  }
  if (teamId && Number.isInteger(teamId)) {
    userWhere.teamId = teamId;
  }

  const where: Prisma.AssignmentWhereInput = {};
  if (Object.keys(userWhere).length > 0) {
    where.user = userWhere;
  }
  if (briefingId && Number.isInteger(briefingId)) {
    where.briefingId = briefingId;
  }
  if (statusParam === "PENDING" || statusParam === "COMPLETED") {
    where.status = statusParam as AssignmentStatus;
  }

  const assignments = await prisma.assignment.findMany({
    where,
    select: {
      id: true,
      status: true,
      assignedAt: true,
      user: { select: { id: true, fullName: true, position: true } },
      briefing: { select: { id: true, title: true } },
    },
    orderBy: [{ status: "asc" }, { assignedAt: "desc" }],
  });
  return json(assignments);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  if (user.role === Role.ROLE_USER) return forbidden("Insufficient role");

  const body = await req.json().catch(() => null);
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid assignment payload", parsed.error.flatten());

  const { briefingId, userIds, teamId } = parsed.data;

  const briefing = await prisma.briefing.findUnique({ where: { id: briefingId } });
  if (!briefing) return badRequest("Briefing not found");

  if (
    user.role === Role.ROLE_COMPANY_ADMIN &&
    briefing.companyId &&
    briefing.companyId !== user.companyId
  ) {
    return forbidden("Cross-company briefing");
  }

  const now = new Date();

  if (teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { select: { id: true, companyId: true } }, project: true },
    });
    if (!team) return badRequest("Team not found");
    if (
      user.role === Role.ROLE_COMPANY_ADMIN &&
      team.project.companyId !== user.companyId
    ) {
      return forbidden("Cross-company team");
    }

    const result = await prisma.$transaction(async (tx) => {
      const teamAssignment = await tx.teamAssignment.upsert({
        where: { teamId_briefingId: { teamId, briefingId } },
        update: { assignedAt: now, assignedById: user.id },
        create: { teamId, briefingId, assignedById: user.id, assignedAt: now },
      });

      const memberIds = team.members.map((m) => m.id);
      const created: number[] = [];
      for (const memberId of memberIds) {
        const existing = await tx.assignment.findFirst({
          where: { userId: memberId, briefingId },
        });
        if (!existing) {
          await tx.assignment.create({
            data: {
              userId: memberId,
              briefingId,
              assignedAt: now,
              status: AssignmentStatus.PENDING,
            },
          });
          created.push(memberId);
        }
      }
      return { teamAssignment, createdForUsers: created };
    });

    return json(result, { status: 201 });
  }

  if (!userIds || userIds.length === 0) return badRequest("userIds must be non-empty when teamId is missing");

  const targets = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, companyId: true },
  });
  if (targets.length !== userIds.length) return badRequest("One or more userIds not found");

  if (user.role === Role.ROLE_COMPANY_ADMIN) {
    const foreign = targets.find((u) => u.companyId !== user.companyId);
    if (foreign) return forbidden("Cross-company user in userIds");
  }

  const result = await prisma.$transaction(async (tx) => {
    const created: number[] = [];
    for (const targetId of userIds) {
      const existing = await tx.assignment.findFirst({
        where: { userId: targetId, briefingId },
      });
      if (!existing) {
        await tx.assignment.create({
          data: {
            userId: targetId,
            briefingId,
            assignedAt: now,
            status: AssignmentStatus.PENDING,
          },
        });
        created.push(targetId);
      }
    }
    return { createdForUsers: created };
  });

  return json(result, { status: 201 });
}
