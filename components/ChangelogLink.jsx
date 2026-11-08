"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CHANGELOG_SEEN_KEY,
  changelogHasUnread,
} from "@/lib/changelog";

export default function ChangelogLink({
  className = "",
  dotClassName = "inline-block h-2 w-2 shrink-0 rounded-full bg-nv-violet",
  children = "What's new",
  onClick,
}) {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    let seen = null;
    try {
      seen = window.localStorage.getItem(CHANGELOG_SEEN_KEY);
    } catch {
      seen = null;
    }
    setUnread(changelogHasUnread(seen));
  }, []);

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
