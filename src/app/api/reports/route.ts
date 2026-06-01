import type { NextRequest } from "next/server";
import { AssignmentStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { json } from "@/lib/http";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser(req);
  if (!user) return response;

  const companyScoped =
    user.role === Role.ROLE_COMPANY_ADMIN && user.companyId
      ? { user: { companyId: user.companyId } }
      : {};

  const [totalAssigned, completed, pending] = await Promise.all([
    prisma.assignment.count({ where: companyScoped }),
    prisma.assignment.count({
      where: { ...companyScoped, status: AssignmentStatus.COMPLETED },
    }),
    prisma.assignment.count({
      where: { ...companyScoped, status: AssignmentStatus.PENDING },
    }),
  ]);

  return json({ totalAssigned, completed, pending });
}
