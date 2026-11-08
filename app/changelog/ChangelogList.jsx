"use client";

import { useEffect } from "react";
import {
  CHANGELOG_SEEN_KEY,
  changelogVersions,
  formatChangelogDate,
  newestChangelogDate,
} from "@/lib/changelog";
import { brutalChrome, rowStripe } from "@/lib/chrome";

function BulletList({ label, tone, items }) {
  if (!items.length) return null;
  const header = tone === "green" ? "bg-nv-green-dark" : "bg-nv-purple-dark";
  const stripe = tone === "green" ? "green" : "purple";
  return (
    <div>
      <h4 className={`${header} px-3 py-1.5 text-[10px] font-black uppercase tracking-wide`}>
        {label}
      </h4>
      <ul>
        {items.map((item, index) => (
          <li
            key={item}
            className={`px-3 py-2 text-sm font-medium leading-relaxed ${rowStripe(index, stripe)}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChangelogList() {
  useEffect(() => {
    const newest = newestChangelogDate();
    if (!newest) return;
    try {
      window.localStorage.setItem(CHANGELOG_SEEN_KEY, newest);
    } catch {
      // A private browser can refuse storage. The page still reads.
    }
  }, []);

  const versions = changelogVersions();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      {versions.map((group) => (
        <section key={group.version} className="space-y-4">
          <h2 className="border-b-brutal-xs border-black bg-nv-green-dark px-4 py-2 text-sm font-black uppercase tracking-wide">
            {group.upcoming ? `v${group.version} · Upcoming` : `v${group.version}`}
          </h2>
          {group.entries.map((entry) => (
            <article key={entry.date} className={`${brutalChrome} bg-nv-paper`}>
              <header className="border-b-brutal-xs border-black bg-nv-purple-dark px-4 py-3">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest">
                  {formatChangelogDate(entry.date)}
                </p>
                <h3 className="mt-1 text-lg font-black uppercase leading-tight">
                  {entry.title}
                </h3>
              </header>
              <BulletList label="New" tone="green" items={entry.new} />
              <BulletList label="Fixed" tone="purple" items={entry.fixed} />
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
