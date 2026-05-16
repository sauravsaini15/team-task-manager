import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/http-error.js";
import { verifyAuthToken } from "../utils/jwt.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const cookieToken = req.cookies?.[env.COOKIE_NAME] as string | undefined;
  const token = bearerToken ?? cookieToken;

  if (!token) throw new HttpError(401, "Authentication required");

  const payload = verifyAuthToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true }
  });

  if (!user) throw new HttpError(401, "Invalid authentication token");

  req.user = user;
  next();
}
