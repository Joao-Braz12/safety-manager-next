import type { NextRequest } from "next/server";
import { AssignmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { declarationSchema } from "@/lib/schemas";
import { badRequest, conflict, json, notFound } from "@/lib/http";

function clientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const briefingId = Number(req.nextUrl.searchParams.get("briefingId"));
  if (!Number.isInteger(briefingId) || briefingId <= 0) {
    return badRequest("Invalid or missing briefingId");
  }

  const declaration = await prisma.declaration.findUnique({
    where: { userId_briefingId: { userId: user.id, briefingId } },
    select: {
      id: true,
      signatureName: true,
      confirmed: true,
      timestamp: true,
      ipAddress: true,
      userAgent: true,
    },
  });
  if (!declaration) return notFound("No declaration for this briefing");

  return json(declaration);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = declarationSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid declaration payload", parsed.error.flatten());

  const briefing = await prisma.briefing.findUnique({
    where: { id: parsed.data.briefingId },
    include: { videos: { select: { id: true, duration: true } } },
  });
  if (!briefing) return badRequest("Briefing not found");

  const existingDecl = await prisma.declaration.findUnique({
    where: {
      userId_briefingId: { userId: user.id, briefingId: briefing.id },
    },
  });
  if (existingDecl) return conflict("Declaration already exists for this briefing");

  if (briefing.videos.length === 0) {
    return badRequest("Briefing has no videos to declare");
  }

  const progress = await prisma.videoProgress.findMany({
    where: {
      userId: user.id,
      videoId: { in: briefing.videos.map((v) => v.id) },
    },
  });

  const completedIds = new Set(progress.filter((p) => p.completed).map((p) => p.videoId));
  const incomplete = briefing.videos.filter((v) => !completedIds.has(v.id));
  if (incomplete.length > 0) {
    return badRequest("All briefing videos must be completed before declaring", {
      missingVideoIds: incomplete.map((v) => v.id),
    });
  }

  const ipAddress = clientIp(req);
  const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const declaration = await tx.declaration.create({
      data: {
        userId: user.id,
        briefingId: briefing.id,
        confirmed: true,
        signatureName: parsed.data.signatureName,
        timestamp: new Date(),
        ipAddress,
        userAgent,
      },
    });
    await tx.assignment.updateMany({
      where: { userId: user.id, briefingId: briefing.id },
      data: { status: AssignmentStatus.COMPLETED },
    });
    return declaration;
  });

  return json(result, { status: 201 });
}
