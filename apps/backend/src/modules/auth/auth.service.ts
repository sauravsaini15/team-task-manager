import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/http-error.js";
import { signAuthToken } from "../../utils/jwt.js";
import { sendPasswordResetEmail } from "../../utils/mailer.js";
import type { loginSchema, signupSchema } from "./auth.validators.js";
import type { z } from "zod";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true
};

export async function signup(input: z.infer<typeof signupSchema>) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new HttpError(409, "Email is already registered");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash
    },
    select: publicUserSelect
  });

  return { user, token: signAuthToken(user.id) };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const userWithPassword = await prisma.user.findUnique({ where: { email: input.email } });
  if (!userWithPassword) throw new HttpError(401, "Invalid email or password");

  const isValidPassword = await bcrypt.compare(input.password, userWithPassword.passwordHash);
  if (!isValidPassword) throw new HttpError(401, "Invalid email or password");

  const { passwordHash: _passwordHash, ...user } = userWithPassword;
  return { user, token: signAuthToken(user.id) };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect
  });

  if (!user) throw new HttpError(404, "User not found");
  return user;
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true }
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      token: rawToken,
      userId: user.id,
      expiresAt
    }
  });

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!record) throw new HttpError(400, "Invalid or expired reset link");
  if (record.used) throw new HttpError(400, "This reset link has already been used");
  if (record.expiresAt < new Date()) throw new HttpError(400, "Reset link has expired");

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true }
    })
  ]);
}
