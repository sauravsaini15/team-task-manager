import { ProjectWorkspace } from "@/features/projects/project-workspace";

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return <ProjectWorkspace projectId={params.projectId} />;
}
