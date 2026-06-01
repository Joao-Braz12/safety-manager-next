import type { NextRequest } from "next/server";
import { Role, type User } from "@prisma/client";
import { prisma } from "./prisma";
import { forbidden, unauthorized } from "./http";

export type AuthedUser = User & {
  company: { id: number; name: string } | null;
  team: { id: number; name: string; projectId: number } | null;
};

export async function getCurrentUser(req: NextRequest): Promise<AuthedUser | null> {
  const uidHeader = req.headers.get("x-user-id");
  if (!uidHeader) return null;
  const uid = Number(uidHeader);
  if (!Number.isInteger(uid)) return null;

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      company: { select: { id: true, name: true } },
      team: { select: { id: true, name: true, projectId: true } },
    },
  });
  return user;
}

export async function requireUser(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return { user: null, response: unauthorized() } as const;
  return { user, response: null } as const;
}

export function requireRole(user: AuthedUser, ...allowed: Role[]) {
  if (!allowed.includes(user.role)) return forbidden();
  return null;
}

export function isSameCompany(user: AuthedUser, companyId: number | null | undefined): boolean {
  if (user.companyId == null || companyId == null) return false;
  return user.companyId === companyId;
}

export function assertSameCompanyOrAdmin(
  user: AuthedUser,
  targetCompanyId: number | null | undefined,
) {
  if (user.role === Role.ROLE_ADMIN) return null;
  if (user.role === Role.ROLE_COMPANY_ADMIN) {
    if (!isSameCompany(user, targetCompanyId)) return forbidden("Cross-company access denied");
    return null;
  }
  return null;
}
