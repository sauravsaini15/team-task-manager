import { TaskStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { getMembershipOrThrow } from "../shared/project-access.js";

export async function getProjectDashboard(projectId: string, userId: string) {
  await getMembershipOrThrow(projectId, userId);
  const now = new Date();

  const [tasks, statusGroups, perUser, overdueTasks, recentActivity] = await Promise.all([
    prisma.task.count({ where: { projectId } }),
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true }
    }),
    prisma.task.groupBy({
      by: ["assigneeId"],
      where: { projectId },
      _count: { _all: true }
    }),
    prisma.task.findMany({
      where: {
        projectId,
        dueDate: { lt: now },
        status: { not: TaskStatus.DONE }
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { dueDate: "asc" },
      take: 5
    }),
    prisma.activity.findMany({
      where: { projectId },
      include: {
        actor: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const users = await prisma.user.findMany({
    where: {
      id: {
        in: perUser.map((item) => item.assigneeId).filter(Boolean) as string[]
      }
    },
    select: { id: true, name: true, email: true }
  });

  const userById = new Map(users.map((user) => [user.id, user]));

  return {
    totalTasks: tasks,
    tasksByStatus: Object.values(TaskStatus).map((status) => ({
      status,
      count: statusGroups.find((item) => item.status === status)?._count._all ?? 0
    })),
    tasksPerUser: perUser.map((item) => ({
      assignee: item.assigneeId ? userById.get(item.assigneeId) ?? null : null,
      count: item._count._all
    })),
    overdueTasks,
    recentActivity
  };
}
