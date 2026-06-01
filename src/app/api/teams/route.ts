import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { teamSchema } from "@/lib/schemas";
import { badRequest, forbidden, json } from "@/lib/http";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const projectIdParam = req.nextUrl.searchParams.get("projectId");
  const filterProjectId = projectIdParam ? Number(projectIdParam) : undefined;

  const where: { project?: { companyId?: number }; projectId?: number } = {};
  if (user.role === Role.ROLE_COMPANY_ADMIN && user.companyId) {
    where.project = { companyId: user.companyId };
  }
  if (filterProjectId && Number.isInteger(filterProjectId)) {
    where.projectId = filterProjectId;
  }

  const teams = await prisma.team.findMany({
    where,
    include: { project: { include: { company: { select: { id: true, name: true } } } } },
    orderBy: { id: "asc" },
  });
  return json(teams);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = teamSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid team payload", parsed.error.flatten());

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
  });
  if (!project) return badRequest("Project not found");

  if (user.role === Role.ROLE_COMPANY_ADMIN) {
    if (project.companyId !== user.companyId) return forbidden("Cross-company access denied");
  } else if (user.role !== Role.ROLE_ADMIN) {
    return forbidden("Insufficient role to create teams");
  }

  const created = await prisma.team.create({
    data: { name: parsed.data.name, projectId: parsed.data.projectId },
    include: { project: { include: { company: { select: { id: true, name: true } } } } },
  });
  return json(created, { status: 201 });
}
