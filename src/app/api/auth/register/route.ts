import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signToken } from "@/lib/jwt";
import { registerSchema } from "@/lib/schemas/auth";
import { badRequest, conflict, json } from "@/lib/http";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid registration payload", parsed.error.flatten());

  const { fullName, email, password, position, companyId } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) return badRequest("Company not found");

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return conflict("Email already registered");

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      fullName,
      email: normalizedEmail,
      password: hashed,
      position: position ?? "Employee",
      role: Role.ROLE_USER,
      companyId,
    },
  });

  const token = await signToken({ sub: user.email, uid: user.id, role: user.role });
  return json({ token, fullName: user.fullName, role: user.role }, { status: 201 });
}
