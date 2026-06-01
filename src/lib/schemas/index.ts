import { z } from "zod";
import { Role } from "@prisma/client";

export const companySchema = z.object({
  name: z.string().min(1),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  companyId: z.number().int().positive().optional(),
});

export const teamSchema = z.object({
  name: z.string().min(1),
  projectId: z.number().int().positive(),
});

export const videoSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  duration: z.number().int().positive(),
  companyId: z.number().int().positive().optional(),
});

export const briefingSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(1000).optional(),
  videoIds: z.array(z.number().int().positive()).default([]),
});

export const assignmentSchema = z
  .object({
    briefingId: z.number().int().positive(),
    userIds: z.array(z.number().int().positive()).optional(),
    teamId: z.number().int().positive().optional(),
  })
  .refine((d) => (d.userIds && d.userIds.length > 0) || d.teamId, {
    message: "Either userIds or teamId must be provided",
  });

export const progressSchema = z.object({
  videoId: z.number().int().positive(),
  watchedTime: z.number().int().nonnegative(),
});

export const declarationSchema = z.object({
  briefingId: z.number().int().positive(),
  confirmed: z.literal(true),
  signatureName: z.string().trim().min(2).max(120),
});

export const userTeamSchema = z.object({
  teamId: z.number().int().positive().nullable(),
});

export const userRoleSchema = z.object({
  role: z.nativeEnum(Role),
});
