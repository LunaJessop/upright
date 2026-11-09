/**
 * What's New entries, newest first.
 *
 * How to add an entry
 * -------------------
 * 1. Add a new object at the top of CHANGELOG.
 * 2. date is YYYY-MM-DD. Keep the list newest first.
 * 3. version is the release this note belongs to, such as "0.5" or "0.6".
 *    The live release is v0.5, dated 2026-11-08. Work that has not shipped
 *    yet goes under the next version with upcoming set to true, shown as Upcoming.
 * 4. title is a short headline a handmaker would understand.
 * 5. new and fixed are plain bullet strings. Either list may be empty.
 * 6. Write what changed for the person using the app, not how it was built.
 * 7. Do not mention security details, vulnerabilities, tokens, endpoints,
 *    or internal names. Fold that work into one line:
 *    "Security and reliability improvements."
 */

export const CHANGELOG_SEEN_KEY = "upright_changelog_seen";

export const CHANGELOG = [
  {
    version: "0.6",
    upcoming: true,
    date: "2026-11-09",
    title: "A photo on the item",
    new: [
      "Add a photo to an item so you can recognize it later. You can replace it or remove it from the item page.",
    ],
    fixed: [],
  },
  {
    version: "0.5",
    upcoming: false,
    date: "2026-11-08",
    title: "A shop can start without a spreadsheet",
    new: [
      "Pick what you make and start with phases and materials. It takes a few minutes, and there is no spreadsheet.",
    ],
    fixed: [],
  },
  {
    version: "0.5",
    upcoming: false,
    date: "2026-11-08",
    title: "Ingredients follow the step",
    new: ["Link ingredients to the production step where they're used."],
    fixed: [],
  },
  {
    version: "0.5",
    upcoming: false,
    date: "2026-11-08",
    title: "Help when you need it",
    new: ["Better support tools so we can help you faster."],
    fixed: [],
  },
  {
    version: "0.5",
    upcoming: false,
    date: "2026-11-08",
    title: "Unit changes stay in sync",
    new: [],
    fixed: [
      "Changing an item to a different kind of unit keeps its recipe and prices in agreement.",
      "The unit-change preview lists every affected line, even when names repeat.",
      "Pressing Escape while confirming a unit change closes that dialog, not the whole item editor.",
      "Security and reliability improvements.",
    ],
  },
  {
    version: "0.5",
    upcoming: false,
    date: "2026-11-06",
    title: "Passwords, recipes, and a clearer welcome",
    new: [
      "You can change an item from one kind of unit to another, such as fluid ounces to each, and preview stock, recipes, and batches before you confirm.",
      "Forgot your password? Request a reset from the login page, then choose a new one from the email.",
      "If the reset email does not show up, the page reminds you to check spam or junk.",
      "The home page now speaks to handmakers.",
      "The recipe section has its own Edit button.",
      "The component list is alphabetical, and you can type to narrow it.",
      "Editing a phase in the library scrolls the form into view and highlights it.",
    ],
    fixed: [],
  },
  {
    version: "0.4",
    upcoming: false,
    date: "2026-10-15",
    title: "Recipes hold still when the stock unit changes",
    new: [],
    fixed: [
      "Changing a stock unit restates the recipe, so the next batch still uses the same amount of each ingredient.",
      "Batch materials show in the unit the item is stocked in. Sixteen ounces of a pound item reads as 1 pound.",
    ],
  },
  {
    version: "0.4",
    upcoming: false,
    date: "2026-10-12",
    title: "Adding a component stays on the page",
    new: [],
    fixed: [
      "Opening the component list while editing a recipe no longer crashes the page.",
    ],
  },
  {
    version: "0.4",
    upcoming: false,
    date: "2026-10-08",
    title: "Batches read like a receipt, and the colors settle",
    new: [
      "The batch list stays in a scroller, and starting a batch opens in a dialog so you do not lose a draft by accident.",
      "Projected costs now read like a receipt, with everyday units such as pints and pounds.",
      "Headers, lists, and buttons use a purple and green palette that is easier to read.",
    ],
    fixed: [],
  },
  {
    version: "0.4",
    upcoming: false,
    date: "2026-10-07",
    title: "Nested recipes no longer collapse to zero",
    new: [],
    fixed: [
      "When a recipe line cannot be scaled, the ingredients under it stay blank instead of showing as zero.",
      "Saving a new stock unit converts the quantities that belong with that unit.",
    ],
  },
  {
    version: "0.4",
    upcoming: false,
    date: "2026-09-27",
    title: "Everyday units, tags, and a steadier sign-in",
    new: [
      "Weight and volume convert between metric and imperial.",
      "Recipe amounts display in units people use, such as cups, pints, and pounds.",
      "You can rename and delete tags from the shared tag list.",
      "A new tag is saved as soon as you add it.",
    ],
    fixed: [
      "The tag list opens when you focus the tag field.",
      "Create and edit forms share the same Cancel button.",
      "Changing an on-hand quantity asks you to confirm first.",
      "Phone navigation works without changing the desktop layout.",
      "After you sign in, you return to the page you were trying to open.",
      "Security and reliability improvements.",
    ],
  },
];

/** Consecutive entries that share a version, still newest first. */
export function changelogVersions(entries = CHANGELOG) {
  const groups = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (!last || last.version !== entry.version) {
      groups.push({
        version: entry.version,
        upcoming: entry.upcoming === true,
        entries: [entry],
      });
    } else {
      last.entries.push(entry);
    }
  }
  return groups;
}

export function newestChangelogDate(entries = CHANGELOG) {
  return entries[0]?.date ?? "";
}

/** True when the newest entry is dated after the one this browser last opened. */
export function changelogHasUnread(lastSeen, entries = CHANGELOG) {
  const newest = newestChangelogDate(entries);
  if (!newest) return false;
  if (typeof lastSeen !== "string" || !lastSeen) return true;
  return newest > lastSeen;
}

export function formatChangelogDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ""));
  if (!match) return String(isoDate ?? "");
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
