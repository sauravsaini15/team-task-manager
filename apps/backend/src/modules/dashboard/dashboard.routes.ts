import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { projectIdParams } from "../projects/project.validators.js";
import * as dashboardController from "./dashboard.controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/:projectId", validate({ params: projectIdParams }), dashboardController.getProjectDashboard);
