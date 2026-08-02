import HelpGuide from "@/components/HelpGuide";
import PublicSiteHeader from "@/components/PublicSiteHeader";

export const metadata = {
  title: "Help — How to set up Upright",
  description:
    "Step-by-step guide to setting up vendors, phases, items, vendor lots, inventory, and production batches in Upright.",
  openGraph: {
    title: "Help — How to set up Upright",
    description:
      "Walk through vendors, items, stock, and production batches — plain language for small product businesses.",
    type: "article",
  },
};

export default function HelpPage() {
  return (
    <div className="min-h-full bg-nv-canvas text-nv-ink">
      <PublicSiteHeader />
      <HelpGuide />
      <footer className="border-t-brutal border-black bg-nv-violet px-4 py-6 text-white sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-2">
          <p className="text-xs font-black lowercase tracking-wide">upright</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">
            Get your business up and to the right
          </p>
        </div>
      </footer>
    </div>
  );
}
