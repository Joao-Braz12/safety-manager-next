import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { loginSchema } from "@/lib/schemas/auth";
import { badRequest, json, unauthorized } from "@/lib/http";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid login payload", parsed.error.flatten());

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return unauthorized("Invalid credentials");

  const ok = await comparePassword(parsed.data.password, user.password);
  if (!ok) return unauthorized("Invalid credentials");

  const token = await signToken({ sub: user.email, uid: user.id, role: user.role });
  return json({ token, fullName: user.fullName, role: user.role });
}
