import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { userRoleSchema } from "@/lib/schemas";
import { getRoleRank } from "@/lib/roles";
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
  const parsed = userRoleSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid role payload", parsed.error.flatten());

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return notFound("User not found");

  if (user.role === Role.ROLE_COMPANY_ADMIN && target.companyId !== user.companyId) {
    return forbidden("Cross-company access denied");
  }

  if (parsed.data.role === Role.ROLE_ADMIN) {
    return forbidden("ROLE_ADMIN cannot be assigned via API");
  }

  const callerRank = getRoleRank(user.role);
  const targetRank = getRoleRank(target.role);
  const newRoleRank = getRoleRank(parsed.data.role);

  if (callerRank <= targetRank || callerRank <= newRoleRank) {
    return forbidden("Insufficient rank to assign this role");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: { id: true, fullName: true, email: true, role: true, companyId: true, teamId: true },
  });
  return json(updated);
}
