import Link from "next/link";

export default function AuthPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-nv-canvas px-4 py-16 text-nv-ink">
      <div className="w-full max-w-sm border-brutal border-black bg-nv-paper p-8 text-center shadow-brutal">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-nv-ink/55">
          upright
        </p>
        <h1 className="mt-2 text-2xl font-black uppercase">Log in or register</h1>
        <p className="mt-3 text-sm font-medium text-nv-ink/70">
          Sign in to your workspace, or create a new company account.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="border-brutal border-black bg-nv-violet px-4 py-3 text-xs font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="border-brutal border-black bg-nv-paper px-4 py-3 text-xs font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5"
          >
            Register
          </Link>
        </div>
        <Link
          href="/"
          className="mt-6 block text-[10px] font-bold uppercase tracking-wide text-nv-ink/50 hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
