"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, CheckCircle2, Circle, Clock3, Filter, Plus, Trash2, UserPlus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ProtectedShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-provider";
import { api, getErrorMessage } from "@/lib/api";
import type { Dashboard, Project, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { formatStatus, isOverdue } from "@/lib/utils";

const statusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const priorityOptions: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

const taskSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(1000).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  assigneeId: z.string().optional()
});

const memberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"])
});

type Filters = {
  status: "" | TaskStatus;
  priority: "" | TaskPriority;
};

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  return (
    <ProtectedShell>
      <ProjectWorkspaceInner projectId={projectId} />
    </ProtectedShell>
  );
}

function ProjectWorkspaceInner({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [filters, setFilters] = React.useState<Filters>({ status: "", priority: "" });
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ project: Project }>(`/projects/${projectId}`);
      return data.project;
    }
  });

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ dashboard: Dashboard }>(`/dashboard/projects/${projectId}`);
      return data.dashboard;
    }
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: async () => {
      const { data } = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`, {
        params: {
          status: filters.status || undefined,
          priority: filters.priority || undefined
        }
      });
      return data.tasks;
    }
  });

  const invalidateWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", projectId] }),
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })
    ]);
  };

  const project = projectQuery.data;
  const myRole = project?.members.find((member) => member.user.id === user?.id)?.role;
  const isAdmin = myRole === "ADMIN";

  if (projectQuery.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Project could not be loaded.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{myRole}</Badge>
            <span className="text-sm text-muted-foreground">{project.members.length} members</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description || "No project description yet."}</p>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </section>

      <Analytics dashboard={dashboardQuery.data} isLoading={dashboardQuery.isLoading} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <TaskBoard
          projectId={projectId}
          tasks={tasksQuery.data ?? []}
          members={project.members}
          isAdmin={isAdmin}
          isLoading={tasksQuery.isLoading}
          onChanged={invalidateWorkspace}
        />
        <aside className="space-y-6">
          {isAdmin ? <CreateTaskPanel projectId={projectId} project={project} onCreated={invalidateWorkspace} /> : null}
          {isAdmin ? <MembersPanel project={project} onChanged={invalidateWorkspace} /> : <MembersReadOnly project={project} />}
          <ActivityPanel dashboard={dashboardQuery.data} />
        </aside>
      </div>
    </div>
  );
}

function FilterBar({ filters, onChange }: { filters: Filters; onChange: (filters: Filters) => void }) {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 md:w-[360px]">
      <Select value={filters.status} aria-label="Filter status" onChange={(event) => onChange({ ...filters, status: event.target.value as Filters["status"] })}>
        <option value="">All statuses</option>
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {formatStatus(status)}
          </option>
        ))}
      </Select>
      <Select value={filters.priority} aria-label="Filter priority" onChange={(event) => onChange({ ...filters, priority: event.target.value as Filters["priority"] })}>
        <option value="">All priorities</option>
        {priorityOptions.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </Select>
    </div>
  );
}

function Analytics({ dashboard, isLoading }: { dashboard?: Dashboard; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  const todo = dashboard?.tasksByStatus.find((item) => item.status === "TODO")?.count ?? 0;
  const progress = dashboard?.tasksByStatus.find((item) => item.status === "IN_PROGRESS")?.count ?? 0;
  const done = dashboard?.tasksByStatus.find((item) => item.status === "DONE")?.count ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard label="Total tasks" value={dashboard?.totalTasks ?? 0} icon={<Circle className="h-4 w-4" />} />
      <MetricCard label="In progress" value={progress} icon={<Clock3 className="h-4 w-4" />} />
      <MetricCard label="Done" value={done} icon={<CheckCircle2 className="h-4 w-4" />} />
      <MetricCard label="Overdue" value={dashboard?.overdueTasks.length ?? 0} icon={<AlertTriangle className="h-4 w-4" />} tone="warning" />
      <div className="hidden">{todo}</div>
    </div>
  );
}

function MetricCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone?: "warning" }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <span className={tone === "warning" ? "text-accent" : "text-primary"}>{icon}</span>
      </CardContent>
    </Card>
  );
}

function TaskBoard({
  projectId,
  tasks,
  members,
  isAdmin,
  isLoading,
  onChanged
}: {
  projectId: string;
  tasks: Task[];
  members: Project["members"];
  isAdmin: boolean;
  isLoading: boolean;
  onChanged: () => Promise<void>;
}) {
  if (isLoading) return <Skeleton className="h-[560px]" />;

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {statusOptions.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <div key={status} className="min-h-96 rounded-lg border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{formatStatus(status)}</h2>
              <Badge variant="secondary">{columnTasks.length}</Badge>
            </div>
            <div className="space-y-3">
              {columnTasks.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No tasks here</div>
              ) : null}
              {columnTasks.map((task) => (
                <TaskCard key={task.id} projectId={projectId} task={task} members={members} isAdmin={isAdmin} onChanged={onChanged} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function CreateTaskPanel({ projectId, project, onCreated }: { projectId: string; project: Project; onCreated: () => Promise<void> }) {
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      priority: "MEDIUM",
      status: "TODO",
      assigneeId: ""
    }
  });

  const createTask = useMutation({
    mutationFn: async (values: z.infer<typeof taskSchema>) => {
      const payload = { ...values, dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null, assigneeId: values.assigneeId || null };
      const { data } = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, payload);
      return data.task;
    },
    onSuccess: async () => {
      toast.success("Task created");
      form.reset({ title: "", description: "", dueDate: "", priority: "MEDIUM", status: "TODO", assigneeId: "" });
      await onCreated();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Create task
        </CardTitle>
        <CardDescription>Admins can assign and manage project tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={form.handleSubmit((values) => createTask.mutate(values))}>
          <Field label="Title" error={form.formState.errors.title?.message}>
            <Input placeholder="Write API tests" {...form.register("title")} />
          </Field>
          <Field label="Description">
            <Textarea placeholder="Acceptance criteria or useful context" {...form.register("description")} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Due date">
              <Input type="date" {...form.register("dueDate")} />
            </Field>
            <Field label="Priority">
              <Select {...form.register("priority")}>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Assignee">
            <Select {...form.register("assigneeId")}>
              <option value="">Unassigned</option>
              {project.members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button className="w-full" type="submit" disabled={createTask.isPending}>
            {createTask.isPending ? "Creating..." : "Add task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TaskCard({
  projectId,
  task,
  members,
  isAdmin,
  onChanged
}: {
  projectId: string;
  task: Task;
  members: Project["members"];
  isAdmin: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = React.useState(false);
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    values: {
      title: task.title,
      description: task.description ?? "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId ?? ""
    }
  });

  const statusMutation = useMutation({
    mutationFn: async (status: TaskStatus) => {
      const { data } = await api.patch<{ task: Task }>(`/projects/${projectId}/tasks/${task.id}/status`, { status });
      return data.task;
    },
    onSuccess: async () => {
      toast.success("Status updated");
      await onChanged();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof taskSchema>) => {
      const payload = { ...values, dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null, assigneeId: values.assigneeId || null };
      const { data } = await api.patch<{ task: Task }>(`/projects/${projectId}/tasks/${task.id}`, payload);
      return data.task;
    },
    onSuccess: async () => {
      toast.success("Task updated");
      setEditing(false);
      await onChanged();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
    },
    onSuccess: async () => {
      toast.success("Task deleted");
      await onChanged();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Card className={overdue ? "border-accent/70" : ""}>
      <CardContent className="space-y-3 p-4">
        {editing ? (
          <form className="space-y-3" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
            <Input {...form.register("title")} />
            <Textarea {...form.register("description")} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input type="date" {...form.register("dueDate")} />
              <Select {...form.register("priority")}>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>
            <Select {...form.register("assigneeId")}>
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button size="sm" type="submit" disabled={updateMutation.isPending}>
                Save
              </Button>
              <Button size="sm" type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium leading-snug">{task.title}</h3>
              <Badge variant={task.priority === "HIGH" ? "destructive" : task.priority === "MEDIUM" ? "warning" : "secondary"}>{task.priority}</Badge>
            </div>
            {task.description ? <p className="text-sm text-muted-foreground">{task.description}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {task.dueDate ? (
                <span className={overdue ? "inline-flex items-center gap-1 text-accent" : "inline-flex items-center gap-1"}>
                  <CalendarClock className="h-3.5 w-3.5" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              ) : null}
              <span>{task.assignee?.name ?? "Unassigned"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant={task.status === status ? "secondary" : "outline"}
                  size="sm"
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(status)}
                >
                  {status === "TODO" ? "To Do" : status === "IN_PROGRESS" ? "Doing" : "Done"}
                </Button>
              ))}
            </div>
            {isAdmin ? (
              <div className="flex justify-between gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button size="icon" variant="ghost" aria-label="Delete task" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MembersPanel({ project, onChanged }: { project: Project; onChanged: () => Promise<void> }) {
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: { email: "", role: "MEMBER" }
  });

  const addMember = useMutation({
    mutationFn: async (values: z.infer<typeof memberSchema>) => {
      await api.post(`/projects/${project.id}/members`, values);
    },
    onSuccess: async () => {
      toast.success("Member added");
      form.reset({ email: "", role: "MEMBER" });
      await onChanged();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${project.id}/members/${userId}`);
    },
    onSuccess: async () => {
      toast.success("Member removed");
      await onChanged();
    },
    onError: (error) => toast.error(getErrorMessage(error))
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Members
        </CardTitle>
        <CardDescription>Add registered users by email.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-2" onSubmit={form.handleSubmit((values) => addMember.mutate(values))}>
          <Input placeholder="teammate@company.com" {...form.register("email")} />
          <Select {...form.register("role")}>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
          <Button type="submit" disabled={addMember.isPending}>
            Add member
          </Button>
        </form>
        <MemberList project={project} onRemove={(userId) => removeMember.mutate(userId)} canRemove />
      </CardContent>
    </Card>
  );
}

function MembersReadOnly({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>People collaborating in this project.</CardDescription>
      </CardHeader>
      <CardContent>
        <MemberList project={project} />
      </CardContent>
    </Card>
  );
}

function MemberList({ project, onRemove, canRemove = false }: { project: Project; onRemove?: (userId: string) => void; canRemove?: boolean }) {
  return (
    <div className="space-y-3">
      {project.members.map((member) => (
        <div key={member.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{member.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>{member.role}</Badge>
            {canRemove ? (
              <Button size="icon" variant="ghost" aria-label="Remove member" onClick={() => onRemove?.(member.user.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityPanel({ dashboard }: { dashboard?: Dashboard }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest project changes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {dashboard?.recentActivity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : null}
        {dashboard?.recentActivity.map((activity) => (
          <div key={activity.id} className="border-l-2 border-primary/40 pl-3">
            <p className="text-sm">{activity.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activity.actor.name} · {new Date(activity.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
