import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { json } from "@/lib/http";

const PUBLIC_SELECT = {
  id: true,
  fullName: true,
  email: true,
  position: true,
  role: true,
  companyId: true,
  teamId: true,
  company: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
} as const;

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const teamIdParam = req.nextUrl.searchParams.get("teamId");
  const filterTeamId = teamIdParam ? Number(teamIdParam) : undefined;

  const where: { companyId?: number; teamId?: number } = {};
  if (user.role === Role.ROLE_COMPANY_ADMIN && user.companyId) {
    where.companyId = user.companyId;
  }
  if (filterTeamId && Number.isInteger(filterTeamId)) {
    where.teamId = filterTeamId;
  }

  const users = await prisma.user.findMany({
    where,
    select: PUBLIC_SELECT,
    orderBy: { id: "asc" },
  });
  return json(users);
}
