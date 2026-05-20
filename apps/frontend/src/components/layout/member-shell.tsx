"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, LayoutDashboard, LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/features/auth/auth-provider";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

export function MemberShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId;

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ project: Project }>(`/projects/${projectId}`);
      return data.project;
    },
    enabled: !!projectId && !!user
  });

  const myRole = projectQuery.data?.members.find((member) => member.user.id === user?.id)?.role;

  React.useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, router, user]);

  if (authLoading || projectQuery.isLoading || !user) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 p-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-80 w-full" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <span>Team Task Manager</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant={pathname === "/dashboard" ? "secondary" : "ghost"} size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Badge variant="secondary" className="hidden h-8 items-center gap-1.5 sm:inline-flex">
              <UserRound className="h-4 w-4" />
              Member View
            </Badge>
            {projectId && myRole === "ADMIN" ? (
              <Button asChild variant="ghost" size="sm" className="hidden text-primary md:inline-flex">
                <Link href={`/projects/${projectId}/admin`}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Switch to Admin Panel
                </Link>
              </Button>
            ) : null}
            <span className="hidden text-sm text-muted-foreground lg:inline">{user.name}</span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="Log out" onClick={() => void logout()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
