"use client";

import { ProjectWorkspaceContent } from "@/features/projects/project-workspace";

export function AdminWorkspace({ projectId }: { projectId: string }) {
  return <ProjectWorkspaceContent projectId={projectId} mode="admin" />;
}
