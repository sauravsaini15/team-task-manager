import type { Request, Response } from "express";
import { clearAuthCookie, setAuthCookie } from "../../utils/auth-cookie.js";
import * as authService from "./auth.service.js";

export async function signup(req: Request, res: Response) {
  const result = await authService.signup(req.body);
  setAuthCookie(res, result.token);
  return res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  setAuthCookie(res, result.token);
  return res.json(result);
}

export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.id);
  return res.json({ user });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  return res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response) {
  await authService.requestPasswordReset(req.body.email);
  return res.json({ message: "If that email is registered, a reset link has been sent." });
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token, req.body.password);
  return res.json({ message: "Password reset successfully. You can now log in." });
}
