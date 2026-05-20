import { AdminWorkspace } from "@/features/projects/admin-workspace";

export default function AdminPage({ params }: { params: { projectId: string } }) {
  return <AdminWorkspace projectId={params.projectId} />;
}
