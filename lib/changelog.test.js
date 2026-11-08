import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHANGELOG,
  changelogHasUnread,
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
  it("puts the unreleased notes in v0.5 and the live release in v0.4", () => {
    const groups = changelogVersions();
    assert.equal(groups[0].version, "0.5");
    assert.equal(groups[0].upcoming, true);
    assert.ok(groups[0].entries.every((entry) => entry.version === "0.5"));
    assert.equal(groups[1].version, "0.4");
    assert.equal(groups[1].upcoming, false);
    const newestReleased = groups[1].entries[0].date;
    const oldestUpcoming = groups[0].entries[groups[0].entries.length - 1].date;
    assert.ok(oldestUpcoming > newestReleased);
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

describe("formatChangelogDate", () => {
  it("formats a calendar date without shifting the day", () => {
    assert.equal(formatChangelogDate("2026-11-08"), "November 8, 2026");
  });
});
