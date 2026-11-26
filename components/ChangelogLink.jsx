"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  CHANGELOG_SEEN_KEY,
  changelogUnreadFrom,
} from "@/lib/changelog";

function subscribeChangelog() {
  return () => {};
}

function readChangelogUnread() {
  return changelogUnreadFrom(() => window.localStorage.getItem(CHANGELOG_SEEN_KEY));
}

export default function ChangelogLink({
  className = "",
  dotClassName = "inline-block h-2 w-2 shrink-0 rounded-full bg-nv-violet",
  children = "What's new",
  onClick,
}) {
  const unread = useSyncExternalStore(
    subscribeChangelog,
    readChangelogUnread,
    () => false
  );

  return (
    <Link href="/changelog" className={className} onClick={onClick}>
      <span>{children}</span>
      {unread ? (
        <span className={dotClassName} aria-hidden="true" />
      ) : null}
      {unread ? <span className="sr-only">New updates</span> : null}
    </Link>
  );
}
