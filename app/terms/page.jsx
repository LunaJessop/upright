import Link from "next/link";
import PublicSiteHeader from "@/components/PublicSiteHeader";

export const metadata = {
  title: "Terms of Service — Upright",
  description: "Draft placeholder. The Terms of Service have not been written yet.",
};

export default function TermsPage() {
  return (
    <div className="min-h-full bg-nv-canvas text-nv-ink">
      <PublicSiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-nv-violet">
          Draft — to be replaced
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-6 border-brutal border-black bg-nv-paper p-4 text-sm font-medium leading-relaxed shadow-brutal-sm">
          This page is a draft placeholder. The Terms of Service have not been
          written yet and will replace this notice.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block text-[10px] font-bold uppercase tracking-wide text-nv-ink/55 hover:underline"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
