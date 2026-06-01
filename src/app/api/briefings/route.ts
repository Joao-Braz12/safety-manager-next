import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { briefingSchema } from "@/lib/schemas";
import { badRequest, json } from "@/lib/http";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const where =
    user.role === Role.ROLE_COMPANY_ADMIN && user.companyId
      ? { companyId: user.companyId }
      : {};

  const briefings = await prisma.briefing.findMany({
    where,
    include: { videos: true },
    orderBy: { id: "asc" },
  });
  return json(briefings);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = briefingSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid briefing payload", parsed.error.flatten());

  const companyId =
    user.role === Role.ROLE_COMPANY_ADMIN ? user.companyId : null;

  if (parsed.data.videoIds.length > 0) {
    const videos = await prisma.video.findMany({
      where: { id: { in: parsed.data.videoIds } },
      select: { id: true, companyId: true },
    });
    if (videos.length !== parsed.data.videoIds.length) {
      return badRequest("One or more videoIds not found");
    }
    if (user.role === Role.ROLE_COMPANY_ADMIN) {
      const foreign = videos.find((v) => v.companyId && v.companyId !== user.companyId);
      if (foreign) return badRequest("Video belongs to a different company");
    }
  }

  const created = await prisma.briefing.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      createdById: user.id,
      companyId: companyId ?? undefined,
      videos: { connect: parsed.data.videoIds.map((id) => ({ id })) },
    },
    include: { videos: true },
  });
  return json(created, { status: 201 });
}
