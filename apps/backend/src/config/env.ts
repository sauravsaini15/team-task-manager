import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24, "JWT_SECRET should be at least 24 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  COOKIE_NAME: z.string().default("ttm_token"),
  COOKIE_SECURE: z
    .preprocess((value) => value === true || value === "true", z.boolean())
    .default(false),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .preprocess((value) => value === true || value === "true", z.boolean())
    .default(false),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string().min(1)
});

export const env = envSchema.parse(process.env);
