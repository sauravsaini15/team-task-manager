import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as authController from "./auth.controller.js";
import { loginSchema, signupSchema } from "./auth.validators.js";

export const authRoutes = Router();

authRoutes.post("/signup", validate({ body: signupSchema }), authController.signup);
authRoutes.post("/login", validate({ body: loginSchema }), authController.login);
authRoutes.get("/me", requireAuth, authController.me);
authRoutes.post("/logout", authController.logout);
