import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-nv-canvas px-4">
          <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/55">
            Loading reset link…
          </p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
