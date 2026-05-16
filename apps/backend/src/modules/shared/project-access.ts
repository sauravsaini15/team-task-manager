import type { ProjectRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/http-error.js";

export async function getMembershipOrThrow(projectId: string, userId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } }
  });

  if (!membership) throw new HttpError(403, "You do not have access to this project");

  return membership;
}

export async function requireProjectAdmin(projectId: string, userId: string) {
  const membership = await getMembershipOrThrow(projectId, userId);

  if (membership.role !== "ADMIN") {
    throw new HttpError(403, "Admin access required");
  }

  return membership;
}

export function canManage(role: ProjectRole) {
  return role === "ADMIN";
}
