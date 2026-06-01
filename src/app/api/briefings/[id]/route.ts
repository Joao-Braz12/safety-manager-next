import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { badRequest, forbidden, json, notFound } from "@/lib/http";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const { id } = await ctx.params;
  const briefingId = Number(id);
  if (!Number.isInteger(briefingId)) return badRequest("Invalid briefing id");

  const briefing = await prisma.briefing.findUnique({
    where: { id: briefingId },
    include: { videos: true },
  });
  if (!briefing) return notFound("Briefing not found");

  if (
    user.role === Role.ROLE_COMPANY_ADMIN &&
    briefing.companyId &&
    briefing.companyId !== user.companyId
  ) {
    return forbidden("Cross-company access denied");
  }

  return json(briefing);
}
