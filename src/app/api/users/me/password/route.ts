import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { comparePassword, hashPassword } from "@/lib/password";
import { changePasswordSchema } from "@/lib/schemas/auth";
import { badRequest, json, unauthorized } from "@/lib/http";

export async function PUT(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Invalid password payload", parsed.error.flatten());
  }

  const ok = await comparePassword(parsed.data.currentPassword, user.password);
  if (!ok) return unauthorized("Current password is incorrect");

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return badRequest("New password must be different from the current one");
  }

  const password = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password } });

  return json({ ok: true });
}
