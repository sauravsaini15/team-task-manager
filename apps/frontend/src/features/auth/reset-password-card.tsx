"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getErrorMessage } from "@/lib/api";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export function ResetPasswordCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-glow">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">Invalid reset link. Please request a new one.</p>
            <Button asChild variant="ghost" size="sm" className="mt-4">
              <Link href="/forgot-password">Request new link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await api.post("/auth/reset-password", {
        token,
        password: values.password
      });
      toast.success("Password reset! You can now sign in.");
      router.push("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Choose a strong password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" type="password" placeholder="Repeat password" {...form.register("confirmPassword")} />
              {form.formState.errors.confirmPassword ? (
                <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
