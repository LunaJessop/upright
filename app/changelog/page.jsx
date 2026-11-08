import PublicSiteHeader from "@/components/PublicSiteHeader";
import ChangelogList from "./ChangelogList";

export const metadata = {
  title: "What's new — Upright",
  description: "What changed recently in Upright, in plain language.",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-full bg-nv-canvas text-nv-ink">
      <PublicSiteHeader />
      <header className="border-b-brutal border-black bg-nv-purple-dark px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Upright
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-tight">
            What's new
          </h1>
          <p className="mt-2 max-w-xl text-sm font-medium text-white/90">
            A short note for each update, newest first.
          </p>
        </div>
      </header>
      <ChangelogList />
    </div>
  );
}
