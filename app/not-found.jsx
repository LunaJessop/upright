import Link from "next/link";
import PublicSiteHeader from "@/components/PublicSiteHeader";

export const metadata = {
  title: "Page not found — Upright",
  description: "That address is not part of Upright.",
};

const linkClass =
  "border-brutal border-black px-5 py-3 text-xs font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none";

export default function NotFound() {
  return (
    <div className="min-h-full bg-nv-canvas text-nv-ink">
      <PublicSiteHeader />
      <div className="mx-auto flex max-w-lg flex-col items-center px-5 py-16 text-center sm:py-24">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-nv-ink/55">
          404
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase leading-none sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-nv-ink/70">
          That address is not part of Upright. Check the link, or head back to
          a page you know.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className={`${linkClass} bg-nv-violet text-white shadow-brutal`}
          >
            Home
          </Link>
          <Link href="/login" className={`${linkClass} bg-nv-paper`}>
            Log in
          </Link>
          <Link href="/help" className={`${linkClass} bg-nv-paper`}>
            Help
          </Link>
        </div>
      </div>
    </div>
  );
}
