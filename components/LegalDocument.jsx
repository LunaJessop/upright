import Link from "next/link";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { brutalChrome } from "@/lib/chrome";
import { LEGAL_DRAFT_COMMENT, LEGAL_LAST_UPDATED } from "@/lib/legal";

export default function LegalDocument({ title, lede, sections }) {
  return (
    <div className="min-h-full bg-nv-canvas text-nv-ink">
      <div
        hidden
        dangerouslySetInnerHTML={{
          __html: `<!-- ${LEGAL_DRAFT_COMMENT} -->`,
        }}
      />
      <PublicSiteHeader />
      <header className="border-b-brutal border-black bg-nv-purple-dark px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
            {LEGAL_DRAFT_COMMENT}
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm font-medium">Last updated {LEGAL_LAST_UPDATED}</p>
          {lede ? <p className="mt-3 max-w-xl text-sm font-medium">{lede}</p> : null}
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        {sections.map((section) => (
          <section key={section.title} className={`${brutalChrome} bg-nv-paper`}>
            <h2 className="border-b-brutal-xs border-black bg-nv-purple-muted px-4 py-2 text-sm font-black uppercase">
              {section.title}
            </h2>
            <div className="space-y-3 px-4 py-3 text-sm font-medium leading-relaxed">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        <Link
          href="/"
          className="inline-block text-[10px] font-bold uppercase tracking-wide text-nv-ink/70 hover:underline"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
