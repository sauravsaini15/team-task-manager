import type { Request, Response } from "express";
import * as taskService from "./task.service.js";

export async function listTasks(req: Request, res: Response) {
  const tasks = await taskService.listTasks(String(req.params.projectId), req.user!.id, req.query as never);
  return res.json({ tasks });
}

export async function createTask(req: Request, res: Response) {
  const task = await taskService.createTask(String(req.params.projectId), req.user!.id, req.body);
  return res.status(201).json({ task });
}

export async function updateTask(req: Request, res: Response) {
  const task = await taskService.updateTask(String(req.params.projectId), String(req.params.taskId), req.user!.id, req.body);
  return res.json({ task });
}

export async function updateTaskStatus(req: Request, res: Response) {
  const task = await taskService.updateTaskStatus(String(req.params.projectId), String(req.params.taskId), req.user!.id, req.body.status);
  return res.json({ task });
}

export async function deleteTask(req: Request, res: Response) {
  await taskService.deleteTask(String(req.params.projectId), String(req.params.taskId), req.user!.id);
  return res.status(204).send();
}
