"use client";

import { useEffect } from "react";
import {
  CHANGELOG_SEEN_KEY,
  changelogVersions,
  formatChangelogDate,
  newestChangelogDate,
} from "@/lib/changelog";

function versionDateGroups() {
  const groups = [];
  for (const version of changelogVersions()) {
    for (const entry of version.entries) {
      const last = groups[groups.length - 1];
      if (!last || last.version !== version.version || last.date !== entry.date) {
        groups.push({
          version: version.version,
          upcoming: version.upcoming,
          date: entry.date,
          entries: [entry],
        });
      } else {
        last.entries.push(entry);
      }
    }
  }
  return groups;
}

function heading(group) {
  if (group.upcoming) return `v${group.version} · Upcoming`;
  return `v${group.version} · ${formatChangelogDate(group.date)}`;
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-medium text-nv-ink/70">What's new</p>
      {versionDateGroups().map((group) => (
        <section key={`${group.version}-${group.date}`} className="mt-10">
          <h1 className="scroll-mt-20 text-2xl font-black leading-tight text-nv-ink sm:text-3xl">
            {heading(group)}
          </h1>
          {group.entries.map((entry) => (
            <article key={`${entry.date}-${entry.title}`} className="mt-8">
              <h2 className="scroll-mt-20 text-lg font-bold leading-snug text-nv-ink sm:text-xl">
                {entry.title}
              </h2>
              <div className="mt-3 space-y-3">
                {[...entry.new, ...entry.fixed].map((line) => (
                  <p key={line} className="text-base leading-relaxed text-nv-ink">
                    {line}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
