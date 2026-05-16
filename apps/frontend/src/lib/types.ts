export type ProjectRole = "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export type ProjectMember = {
  id: string;
  role: ProjectRole;
  userId: string;
  projectId: string;
  createdAt: string;
  user: User;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  members: ProjectMember[];
  _count?: {
    tasks: number;
  };
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  assigneeId?: string | null;
  assignee?: User | null;
};

export type Activity = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  actor: User;
};

export type Dashboard = {
  totalTasks: number;
  tasksByStatus: { status: TaskStatus; count: number }[];
  tasksPerUser: { assignee: User | null; count: number }[];
  overdueTasks: Task[];
  recentActivity: Activity[];
};
