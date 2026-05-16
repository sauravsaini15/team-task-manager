import { Router } from "express";
import { requireAuth } from "./middleware/auth.middleware.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { projectRoutes } from "./modules/projects/project.routes.js";
import { taskRoutes } from "./modules/tasks/task.routes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => res.json({ status: "ok" }));
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/projects", requireAuth, projectRoutes);
apiRoutes.use("/projects/:projectId/tasks", requireAuth, taskRoutes);
apiRoutes.use("/dashboard/projects", requireAuth, dashboardRoutes);
