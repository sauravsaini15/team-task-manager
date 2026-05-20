import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import * as authController from "./auth.controller.js";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "./auth.validators.js";

export const authRoutes = Router();

authRoutes.post("/signup", validate({ body: signupSchema }), authController.signup);
authRoutes.post("/login", validate({ body: loginSchema }), authController.login);
authRoutes.post("/forgot-password", validate({ body: forgotPasswordSchema }), authController.forgotPassword);
authRoutes.post("/reset-password", validate({ body: resetPasswordSchema }), authController.resetPassword);
authRoutes.get("/me", requireAuth, authController.me);
authRoutes.post("/logout", authController.logout);
