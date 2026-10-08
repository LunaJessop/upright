import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreateTag,
  filterTagSuggestions,
  listTagsForPicker,
  moveTagHighlight,
} from "./tagSuggestions.js";

const catalog = [
  { id: 1, name: "Seasonal" },
  { id: 2, name: "Retail" },
  { id: 3, name: "Wholesale" },
  { id: 4, name: "Limited" },
];

test("an empty query lists existing tags that are not already selected", () => {
  assert.deepEqual(
    filterTagSuggestions(catalog, [{ id: 2, name: "Retail" }], "").map((tag) => tag.name),
    ["Seasonal", "Wholesale", "Limited"]
  );
});

test("typing filters the open list and still allows a new tag", () => {
  assert.deepEqual(
    filterTagSuggestions(catalog, [], "sea").map((tag) => tag.name),
    ["Seasonal"]
  );
  assert.equal(canCreateTag(catalog, [], "sea"), true);
  assert.equal(canCreateTag(catalog, [], "Seasonal"), false);
  assert.equal(canCreateTag(catalog, [{ name: "Gift" }], "gift"), false);
  assert.equal(canCreateTag(catalog, [], "   "), false);
});

test("arrow keys move within the list and stop at the ends", () => {
  assert.equal(moveTagHighlight(-1, 1, 4), 0);
  assert.equal(moveTagHighlight(0, 1, 4), 1);
  assert.equal(moveTagHighlight(3, 1, 4), 3);
  assert.equal(moveTagHighlight(0, -1, 4), 0);
  assert.equal(moveTagHighlight(-1, -1, 4), 0);
  assert.equal(moveTagHighlight(1, 1, 0), -1);
});

test("the picker list keeps selected tags so they can be renamed or deleted", () => {
  assert.deepEqual(
    listTagsForPicker(catalog, "").map((tag) => tag.name),
    ["Seasonal", "Retail", "Wholesale", "Limited"]
  );
  assert.deepEqual(
    listTagsForPicker(catalog, "re").map((tag) => tag.name),
    ["Retail"]
  );
  assert.deepEqual(listTagsForPicker(null, "a"), []);
});

test("suggestion filtering ignores a missing catalog", () => {
  assert.deepEqual(filterTagSuggestions(null, [], "a"), []);
  assert.equal(canCreateTag(null, [], "New"), true);
});
