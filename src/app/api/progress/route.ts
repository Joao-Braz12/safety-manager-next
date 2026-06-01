import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { progressSchema } from "@/lib/schemas";
import { badRequest, json } from "@/lib/http";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid progress payload", parsed.error.flatten());

  const video = await prisma.video.findUnique({
    where: { id: parsed.data.videoId },
    select: { id: true, duration: true },
  });
  if (!video) return badRequest("Video not found");

  const existing = await prisma.videoProgress.findUnique({
    where: { userId_videoId: { userId: user.id, videoId: video.id } },
  });

  const claimed = parsed.data.watchedTime;
  const previousWatched = existing?.watchedTime ?? 0;
  const watchedTime = Math.min(
    Math.max(previousWatched, claimed),
    video.duration,
  );

  const completed = watchedTime >= video.duration;
  const completedAt = completed
    ? existing?.completedAt ?? new Date()
    : null;

  const upserted = await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId: user.id, videoId: video.id } },
    update: { watchedTime, completed, completedAt },
    create: {
      userId: user.id,
      videoId: video.id,
      watchedTime,
      completed,
      completedAt,
    },
  });
  return json(upserted);
}
