import type { Request, Response } from "express";
import * as projectService from "./project.service.js";

export async function listProjects(req: Request, res: Response) {
  const projects = await projectService.listProjects(req.user!.id);
  return res.json({ projects });
}

export async function createProject(req: Request, res: Response) {
  const project = await projectService.createProject(req.user!.id, req.body);
  return res.status(201).json({ project });
}

export async function getProject(req: Request, res: Response) {
  const project = await projectService.getProject(String(req.params.projectId), req.user!.id);
  return res.json({ project });
}

export async function addMember(req: Request, res: Response) {
  const member = await projectService.addMember(String(req.params.projectId), req.user!.id, req.body);
  return res.status(201).json({ member });
}

export async function removeMember(req: Request, res: Response) {
  await projectService.removeMember(String(req.params.projectId), req.user!.id, String(req.params.userId));
  return res.status(204).send();
}
