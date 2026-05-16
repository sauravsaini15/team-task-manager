import { TaskPriority, TaskStatus } from "@prisma/client";
import { z } from "zod";

export const projectTaskParams = z.object({
  projectId: z.string().cuid()
});

export const taskParams = z.object({
  projectId: z.string().cuid(),
  taskId: z.string().cuid()
});

export const taskQuery = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional()
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  assigneeId: z.string().cuid().optional().nullable()
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus)
});
