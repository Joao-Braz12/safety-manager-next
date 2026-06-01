import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { projectSchema } from "@/lib/schemas";
import { badRequest, forbidden, json } from "@/lib/http";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const companyIdParam = req.nextUrl.searchParams.get("companyId");
  const filterCompanyId = companyIdParam ? Number(companyIdParam) : undefined;

  const where: { companyId?: number } = {};
  if (user.role === Role.ROLE_COMPANY_ADMIN && user.companyId) {
    where.companyId = user.companyId;
  }
  if (filterCompanyId && Number.isInteger(filterCompanyId)) {
    // AND with role scoping: a company admin can only ever see their own company.
    if (where.companyId === undefined || where.companyId === filterCompanyId) {
      where.companyId = filterCompanyId;
    } else {
      return json([]);
    }
  }

  const projects = await prisma.project.findMany({
    where,
    include: { company: { select: { id: true, name: true } } },
    orderBy: { id: "asc" },
  });
  return json(projects);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid project payload", parsed.error.flatten());

  let companyId: number | undefined = parsed.data.companyId;
  if (user.role === Role.ROLE_COMPANY_ADMIN) {
    if (!user.companyId) return forbidden("No company assigned");
    companyId = user.companyId;
  } else if (user.role === Role.ROLE_ADMIN) {
    if (!companyId) return badRequest("companyId is required for ROLE_ADMIN");
  } else {
    return forbidden("Insufficient role to create projects");
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return badRequest("Company not found");

  const created = await prisma.project.create({
    data: { name: parsed.data.name, companyId },
    include: { company: { select: { id: true, name: true } } },
  });
  return json(created, { status: 201 });
}
