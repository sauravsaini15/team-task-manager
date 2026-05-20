import { MemberShell } from "@/components/layout/member-shell";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <MemberShell>{children}</MemberShell>;
}
