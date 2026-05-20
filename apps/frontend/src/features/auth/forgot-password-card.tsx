"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, getErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Please enter a valid email address")
});

export function ForgotPasswordCard() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" }
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await api.post("/auth/forgot-password", values);
      setSubmitted(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>Enter your account email and we will send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If that email is registered, a reset link has been sent. Check your inbox.
              </p>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
