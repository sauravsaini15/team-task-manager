"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api";
import { useAuth } from "./auth-provider";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type AuthCardProps = {
  mode: "login" | "signup";
};

export function AuthCard({ mode }: AuthCardProps) {
  const isSignup = mode === "signup";
  const { login, signup } = useAuth();
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(isSignup ? signupSchema : loginSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    try {
      if (isSignup) await signup(values);
      else await login({ email: values.email, password: values.password });
      toast.success(isSignup ? "Account created" : "Welcome back");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader>
          <CardTitle>{isSignup ? "Create your workspace account" : "Sign in to your workspace"}</CardTitle>
          <CardDescription>
            {isSignup ? "Start a clean project board in under a minute." : "Manage projects, tasks, and team activity."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {isSignup ? (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" autoComplete="name" {...form.register("name")} />
                <FieldError message={form.formState.errors.name?.message} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
              <FieldError message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignup ? (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <Input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} {...form.register("password")} />
              <FieldError message={form.formState.errors.password?.message} />
            </div>
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "New here?"}{" "}
            <Link className="font-medium text-primary hover:underline" href={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Sign in" : "Create account"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
