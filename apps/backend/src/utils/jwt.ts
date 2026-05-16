import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

type JwtPayload = {
  userId: string;
};

export function signAuthToken(userId: string) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ userId }, env.JWT_SECRET, options);
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
