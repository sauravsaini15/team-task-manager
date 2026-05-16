import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/http-error.js";
import { signAuthToken } from "../../utils/jwt.js";
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
