import { MemberWorkspace } from "@/features/projects/member-workspace";

export default function MemberProjectPage({ params }: { params: { projectId: string } }) {
  return <MemberWorkspace projectId={params.projectId} />;
}
