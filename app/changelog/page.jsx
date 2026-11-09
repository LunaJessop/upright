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
      <ChangelogList />
    </div>
  );
}
