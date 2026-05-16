import type { ActivityType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

type CreateActivityInput = {
  projectId: string;
  actorId: string;
  type: ActivityType;
  message: string;
};

export function createActivity(input: CreateActivityInput) {
  return prisma.activity.create({ data: input });
}
