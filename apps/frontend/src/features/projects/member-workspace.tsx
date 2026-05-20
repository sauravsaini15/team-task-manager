"use client";

import { ProjectWorkspaceContent } from "@/features/projects/project-workspace";

export function MemberWorkspace({ projectId }: { projectId: string }) {
  return <ProjectWorkspaceContent projectId={projectId} mode="member" />;
}
