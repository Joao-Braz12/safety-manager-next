import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { videoSchema } from "@/lib/schemas";
import { badRequest, json } from "@/lib/http";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const where =
    user.role === Role.ROLE_COMPANY_ADMIN && user.companyId
      ? { companyId: user.companyId }
      : {};

  const videos = await prisma.video.findMany({
    where,
    orderBy: { id: "asc" },
  });
  return json(videos);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = videoSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid video payload", parsed.error.flatten());

  const companyId =
    user.role === Role.ROLE_COMPANY_ADMIN
      ? user.companyId
      : parsed.data.companyId ?? null;

  const created = await prisma.video.create({
    data: {
      title: parsed.data.title,
      url: parsed.data.url,
      duration: parsed.data.duration,
      createdById: user.id,
      companyId: companyId ?? undefined,
    },
  });
  return json(created, { status: 201 });
}
