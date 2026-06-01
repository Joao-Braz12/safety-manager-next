import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/auth";
import { companySchema } from "@/lib/schemas";
import { badRequest, conflict, json } from "@/lib/http";

export async function GET() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
  return json(companies);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;
  const denied = requireRole(user, Role.ROLE_ADMIN);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid company payload", parsed.error.flatten());

  const existing = await prisma.company.findUnique({ where: { name: parsed.data.name } });
  if (existing) return conflict("Company name already exists");

  const created = await prisma.company.create({ data: { name: parsed.data.name } });
  return json(created, { status: 201 });
}
