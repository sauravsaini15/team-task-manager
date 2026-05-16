import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import * as taskController from "./task.controller.js";
import { createTaskSchema, projectTaskParams, taskParams, taskQuery, updateTaskSchema, updateTaskStatusSchema } from "./task.validators.js";

export const taskRoutes = Router({ mergeParams: true });

taskRoutes.get("/", validate({ params: projectTaskParams, query: taskQuery }), taskController.listTasks);
taskRoutes.post("/", validate({ params: projectTaskParams, body: createTaskSchema }), taskController.createTask);
taskRoutes.patch("/:taskId", validate({ params: taskParams, body: updateTaskSchema }), taskController.updateTask);
taskRoutes.patch("/:taskId/status", validate({ params: taskParams, body: updateTaskStatusSchema }), taskController.updateTaskStatus);
taskRoutes.delete("/:taskId", validate({ params: taskParams }), taskController.deleteTask);
