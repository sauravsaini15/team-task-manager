import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResetPasswordCard } from "@/features/auth/reset-password-card";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <Skeleton className="h-80 w-full max-w-md" />
        </div>
      }
    >
      <ResetPasswordCard />
    </Suspense>
  );
}
