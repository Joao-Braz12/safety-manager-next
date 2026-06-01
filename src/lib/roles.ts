import { Role } from "@prisma/client";

export const ROLE_RANK: Record<Role, number> = {
  ROLE_ADMIN: 4,
  ROLE_COMPANY_ADMIN: 3,
  ROLE_PROJECT_LEADER: 2,
  ROLE_USER: 1,
};

export function getRoleRank(role: Role | string): number {
  return ROLE_RANK[role as Role] ?? 0;
}

export const ASSIGNABLE_ROLES: Role[] = [
  Role.ROLE_USER,
  Role.ROLE_PROJECT_LEADER,
  Role.ROLE_COMPANY_ADMIN,
];
