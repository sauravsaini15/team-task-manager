import type { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { HttpError, notFound } from "../../utils/http-error.js";
import { createActivity } from "../shared/activity.service.js";
import { getMembershipOrThrow, requireProjectAdmin } from "../shared/project-access.js";
import type { createTaskSchema, taskQuery, updateTaskSchema } from "./task.validators.js";
import type { z } from "zod";

const taskInclude = {
  assignee: {
    select: { id: true, name: true, email: true }
  }
};

export async function listTasks(projectId: string, userId: string, filters: z.infer<typeof taskQuery>) {
  const membership = await getMembershipOrThrow(projectId, userId);
  const where: Prisma.TaskWhereInput = {
    projectId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {})
  };

  if (membership.role === "MEMBER") {
    where.assigneeId = userId;
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }]
  });
}

async function assertAssigneeIsProjectMember(projectId: string, assigneeId?: string | null) {
  if (!assigneeId) return;

  const membership = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: assigneeId, projectId } }
  });

  if (!membership) throw new HttpError(400, "Assignee must be a project member");
}

export async function createTask(projectId: string, actorId: string, input: z.infer<typeof createTaskSchema>) {
  await requireProjectAdmin(projectId, actorId);
  await assertAssigneeIsProjectMember(projectId, input.assigneeId);

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      priority: input.priority,
      status: input.status,
      projectId,
      assigneeId: input.assigneeId
    },
    include: taskInclude
  });

  await createActivity({
    projectId,
    actorId,
    type: "TASK_CREATED",
    message: `Task "${task.title}" was created`
  });

  return task;
}

export async function updateTask(projectId: string, taskId: string, actorId: string, input: z.infer<typeof updateTaskSchema>) {
  await requireProjectAdmin(projectId, actorId);
  await assertAssigneeIsProjectMember(projectId, input.assigneeId);

  const existingTask = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!existingTask) throw notFound("Task");

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {})
    },
    include: taskInclude
  });

  await createActivity({
    projectId,
    actorId,
    type: "TASK_UPDATED",
    message: `Task "${task.title}" was updated`
  });

  return task;
}

export async function updateTaskStatus(projectId: string, taskId: string, actorId: string, status: TaskStatus) {
  const membership = await getMembershipOrThrow(projectId, actorId);
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId }, include: taskInclude });
  if (!task) throw notFound("Task");

  if (membership.role === "MEMBER" && task.assigneeId !== actorId) {
    throw new HttpError(403, "Members can only update their assigned tasks");
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: taskInclude
  });

  await createActivity({
    projectId,
    actorId,
    type: "TASK_STATUS_UPDATED",
    message: `Task "${updatedTask.title}" moved to ${status.replace("_", " ").toLowerCase()}`
  });

  return updatedTask;
}

export async function deleteTask(projectId: string, taskId: string, actorId: string) {
  await requireProjectAdmin(projectId, actorId);
  const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) throw notFound("Task");

  await prisma.task.delete({ where: { id: taskId } });
  await createActivity({
    projectId,
    actorId,
    type: "TASK_DELETED",
    message: `Task "${task.title}" was deleted`
  });

  return { ok: true };
}
