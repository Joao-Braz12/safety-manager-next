import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json, notFound } from "@/lib/http";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isInteger(userId)) return badRequest("Invalid user id");

  const target = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
    },
  });
  if (!target) return notFound("User not found");

  if (
    user.role === Role.ROLE_COMPANY_ADMIN &&
    target.companyId !== user.companyId
  ) {
    return forbidden("Cross-company access denied");
  }

  const { password: _pw, ...safe } = target;
  return json(safe);
}
