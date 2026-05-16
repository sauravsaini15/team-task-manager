import type { Request, Response } from "express";
import * as dashboardService from "./dashboard.service.js";

export async function getProjectDashboard(req: Request, res: Response) {
  const dashboard = await dashboardService.getProjectDashboard(String(req.params.projectId), req.user!.id);
  return res.json({ dashboard });
}
