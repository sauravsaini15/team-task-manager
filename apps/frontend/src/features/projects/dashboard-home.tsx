"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-provider";
import { api, getErrorMessage } from "@/lib/api";
import type { Project } from "@/lib/types";

const projectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional()
});

export function DashboardHome() {
  return (
    <ProtectedShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ProjectList />
        <CreateProjectPanel />
      </div>
    </ProtectedShell>
  );
}

function ProjectList() {
  const { user } = useAuth();
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>("/projects");
      return data.projects;
    }
  });

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-medium text-primary">Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Projects</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Track active work, member access, task volume, and progress from one focused dashboard.
        </p>
      </div>
      {projectsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : null}
      {projectsQuery.data?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No projects yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create the first project to become its Admin, invite members, and start assigning tasks.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {projectsQuery.data?.map((project) => {
          const myRole = project.members.find((member) => member.user.id === user?.id)?.role;
          const projectHref = myRole === "ADMIN" ? `/projects/${project.id}/admin` : `/projects/${project.id}`;

          return (
            <Link key={project.id} href={projectHref}>
              <Card className="h-full transition-colors hover:border-primary/60 hover:bg-card/80">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {project.description || "No description added yet."}
                      </CardDescription>
                    </div>
                    <Badge variant={myRole === "ADMIN" ? "default" : "secondary"}>{myRole}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {project.members.length} members
                  </span>
                  <span>{project._count?.tasks ?? 0} tasks</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CreateProjectPanel() {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", description: "" }
  });

  const createProject = useMutation({
    mutationFn: async (values: z.infer<typeof projectSchema>) => {
      const { data } = await api.post<{ project: Project }>("/projects", values);
      return data.project;
    },
    onSuccess: async () => {
      toast.success("Project created");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <aside>
      <Card className="lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            New project
          </CardTitle>
          <CardDescription>Creator access is saved as Admin automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => createProject.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" placeholder="Website redesign" {...form.register("name")} />
              <FieldError message={form.formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea id="project-description" placeholder="Scope, outcome, and team context" {...form.register("description")} />
              <FieldError message={form.formState.errors.description?.message} />
            </div>
            <Button className="w-full" type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create project"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </aside>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
