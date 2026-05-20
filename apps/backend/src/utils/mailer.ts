import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"Team Task Manager" <${env.SMTP_USER}>`,
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset for your Team Task Manager account.</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="color:#0d9488;font-weight:bold;">Reset Password</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `
  });
}
