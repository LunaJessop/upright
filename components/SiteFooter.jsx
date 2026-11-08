import ChangelogLink from "@/components/ChangelogLink";

export default function SiteFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-black/50 px-3 py-1 text-center">
      <ChangelogLink
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white"
        dotClassName="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white"
      />
      <p className="text-[10px] font-bold uppercase tracking-widest text-white">
        © {new Date().getFullYear()} Upright
      </p>
    </footer>
  );
}
