import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHANGELOG,
  changelogHasUnread,
  changelogUnreadFrom,
  changelogVersions,
  formatChangelogDate,
  newestChangelogDate,
} from "./changelog.js";

const FORBIDDEN = [
  "token",
  "vulnerability",
  "endpoint",
  "secret",
  "exploit",
  "cve",
  "posthog",
  "/api",
  "change-unit",
  "analytics",
];

describe("CHANGELOG", () => {
  it("lists dates newest first", () => {
    const dates = CHANGELOG.map((entry) => entry.date);
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    assert.deepEqual(dates, sorted);
    assert.equal(newestChangelogDate(), dates[0]);
  });

  it("gives every entry a title and plain new and fixed lists", () => {
    for (const entry of CHANGELOG) {
      assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(entry.version, /^\d+\.\d+$/);
      assert.equal(typeof entry.title, "string");
      assert.ok(entry.title.trim().length > 0);
      assert.ok(Array.isArray(entry.new));
      assert.ok(Array.isArray(entry.fixed));
      assert.ok(entry.new.length + entry.fixed.length > 0);
    }
  });

  it("keeps security work generic and leaves out internal names", () => {
    const text = CHANGELOG.flatMap((entry) => [
      entry.title,
      ...entry.new,
      ...entry.fixed,
    ])
      .join("\n")
      .toLowerCase();
    for (const word of FORBIDDEN) {
      assert.equal(text.includes(word), false, word);
    }
    assert.match(text, /security and reliability improvements/);
  });
});

describe("changelogVersions", () => {
  it("ships one v0.7 entry on November 27, 2026 and keeps v0.6 behind it", () => {
    const groups = changelogVersions();
    assert.equal(groups[0].version, "0.7");
    assert.equal(groups[0].upcoming, false);
    assert.equal(groups[0].entries.length, 1);
    const released07 = groups[0].entries[0];
    assert.equal(released07.date, "2026-11-27");
    assert.equal(released07.upcoming, false);
    assert.equal(released07.title, "Photos, stock, and the steps you repeat");
    assert.equal(formatChangelogDate(released07.date), "November 27, 2026");
    const notes = [...released07.new, ...released07.fixed].join("\n");
    assert.match(notes, /small photo on the right/);
    assert.match(notes, /photo sits next to the description/);
    assert.match(notes, /It saves when you press Save/);
    assert.match(notes, /use Transaction to record stock/);
    assert.match(notes, /scrolls it into view/);
    assert.match(notes, /Start from a router/);
    assert.match(notes, /catalog filters sit on a grey bar/);
    assert.match(notes, /production queue remembers its search/);
    assert.match(notes, /small question mark/);
    assert.match(notes, /grey outline while they load/);
    assert.match(notes, /Security and reliability improvements/);
    const current = groups.find((group) => group.version === "0.6");
    assert.equal(current.upcoming, false);
    assert.ok(current.entries.every((entry) => entry.version === "0.6" && entry.upcoming === false));
    assert.equal(formatChangelogDate(current.entries[0].date), "November 8, 2026");
    const released = groups.find((group) => group.version === "0.5");
    assert.equal(released.upcoming, false);
    assert.equal(released.entries[0].date, "2026-11-08");
    assert.equal(formatChangelogDate(released.entries[0].date), "November 8, 2026");
    assert.ok(released.entries.every((entry) => entry.version === "0.5" && entry.upcoming === false));
    const previous = groups.find((group) => group.version === "0.4");
    assert.equal(previous.upcoming, false);
    assert.ok(released.entries.at(-1).date > previous.entries[0].date);
  });
});

describe("changelogHasUnread", () => {
  it("treats a missing or older view as unread", () => {
    assert.equal(changelogHasUnread(null), true);
    assert.equal(changelogHasUnread(""), true);
    assert.equal(changelogHasUnread("2026-10-01"), true);
  });

  it("is read once the newest date has been opened", () => {
    assert.equal(changelogHasUnread(newestChangelogDate()), false);
    assert.equal(changelogHasUnread("2099-01-01"), false);
  });
});

describe("changelogUnreadFrom", () => {
  it("stays unread when storage cannot be read", () => {
    assert.equal(changelogUnreadFrom(() => null), true);
    assert.equal(changelogUnreadFrom(() => "2099-01-01"), false);
    assert.equal(
      changelogUnreadFrom(() => {
        throw new Error("storage blocked");
      }),
      true
    );
  });
});

describe("formatChangelogDate", () => {
  it("formats a calendar date without shifting the day", () => {
    assert.equal(formatChangelogDate("2026-11-08"), "November 8, 2026");
  });
});
