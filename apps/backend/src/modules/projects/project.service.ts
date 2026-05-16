import { ProjectRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { createActivity } from "../shared/activity.service.js";
import { requireProjectAdmin, getMembershipOrThrow } from "../shared/project-access.js";
import { HttpError, notFound } from "../../utils/http-error.js";
import type { addMemberSchema, createProjectSchema } from "./project.validators.js";
import type { z } from "zod";

const projectInclude = {
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: "asc" as const }
  },
  _count: {
    select: { tasks: true }
  }
};

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      members: {
        some: { userId }
      }
    },
    include: projectInclude,
    orderBy: { updatedAt: "desc" }
  });
}

export async function createProject(userId: string, input: z.infer<typeof createProjectSchema>) {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      members: {
        create: {
          userId,
          role: ProjectRole.ADMIN
        }
      }
    },
    include: projectInclude
  });

  await createActivity({
    projectId: project.id,
    actorId: userId,
    type: "PROJECT_CREATED",
    message: "Project created"
  });

  return project;
}

export async function getProject(projectId: string, userId: string) {
  await getMembershipOrThrow(projectId, userId);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude
  });

  if (!project) throw notFound("Project");
  return project;
}

export async function addMember(projectId: string, actorId: string, input: z.infer<typeof addMemberSchema>) {
  await requireProjectAdmin(projectId, actorId);
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true }
  });

  if (!user) throw new HttpError(404, "No registered user found for this email");

  const membership = await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: user.id, projectId } },
    update: { role: input.role },
    create: {
      userId: user.id,
      projectId,
      role: input.role
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  await createActivity({
    projectId,
    actorId,
    type: "MEMBER_ADDED",
    message: `${user.name} was added as ${input.role.toLowerCase()}`
  });

  return membership;
}

export async function removeMember(projectId: string, actorId: string, userId: string) {
  await requireProjectAdmin(projectId, actorId);
  if (actorId === userId) throw new HttpError(400, "Admins cannot remove themselves");

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    include: { user: true }
  });

  if (!membership) throw notFound("Project member");

  await prisma.projectMember.delete({
    where: { userId_projectId: { userId, projectId } }
  });

  await createActivity({
    projectId,
    actorId,
    type: "MEMBER_REMOVED",
    message: `${membership.user.name} was removed from the project`
  });

  return { ok: true };
}
