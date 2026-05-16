import { ProjectRole } from "@prisma/client";
import { z } from "zod";

export const projectIdParams = z.object({
  projectId: z.string().cuid()
});

export const projectMemberParams = z.object({
  projectId: z.string().cuid(),
  userId: z.string().cuid()
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable()
});

export const addMemberSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER)
});
