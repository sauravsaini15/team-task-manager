import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import * as projectController from "./project.controller.js";
import { addMemberSchema, createProjectSchema, projectIdParams, projectMemberParams } from "./project.validators.js";

export const projectRoutes = Router();

projectRoutes.get("/", projectController.listProjects);
projectRoutes.post("/", validate({ body: createProjectSchema }), projectController.createProject);
projectRoutes.get("/:projectId", validate({ params: projectIdParams }), projectController.getProject);
projectRoutes.post(
  "/:projectId/members",
  validate({ params: projectIdParams, body: addMemberSchema }),
  projectController.addMember
);
projectRoutes.delete(
  "/:projectId/members/:userId",
  validate({ params: projectMemberParams }),
  projectController.removeMember
);
