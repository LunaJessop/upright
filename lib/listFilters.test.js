import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BATCH_LIST_DEFAULTS,
  BATCH_LIST_FILTER_KEY,
  ITEM_LIST_DEFAULTS,
  ITEM_LIST_FILTER_KEY,
  batchListFiltersActive,
  batchMatchesListFilter,
  itemListFiltersActive,
  listFilterStorageKey,
  parseListFilterRaw,
  readStoredListFilters,
  removeStoredListFilters,
  sanitizeBatchListFilters,
  sanitizeItemListFilters,
  writeStoredListFilters,
} from "./listFilters.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
    get size() {
      return values.size;
    },
  };
}

describe("list filter storage", () => {
  it("scopes a key by user id and skips a missing id", () => {
    assert.equal(
      listFilterStorageKey(ITEM_LIST_FILTER_KEY, "4"),
      "upright_items_list_filters:4"
    );
    assert.equal(
      listFilterStorageKey(BATCH_LIST_FILTER_KEY, 9),
      "upright_batches_list_filters:9"
    );
    assert.equal(listFilterStorageKey(ITEM_LIST_FILTER_KEY, null), null);
    assert.equal(listFilterStorageKey(ITEM_LIST_FILTER_KEY, "  "), null);
    assert.notEqual(
      listFilterStorageKey(ITEM_LIST_FILTER_KEY, "4"),
      listFilterStorageKey(ITEM_LIST_FILTER_KEY, "5")
    );
  });

  it("round-trips a value and ignores a bad payload", () => {
    const storage = memoryStorage();
    const key = listFilterStorageKey(ITEM_LIST_FILTER_KEY, "4");
    assert.equal(readStoredListFilters(key, storage), null);
    assert.equal(
      writeStoredListFilters(key, { type: "make", query: "oak" }, storage),
      true
    );
    assert.deepEqual(readStoredListFilters(key, storage), { type: "make", query: "oak" });
    assert.equal(removeStoredListFilters(key, storage), true);
    assert.equal(readStoredListFilters(key, storage), null);
    assert.equal(storage.size, 0);

    storage.setItem(key, "{");
    assert.equal(readStoredListFilters(key, storage), null);
    storage.setItem(key, "[1]");
    assert.equal(parseListFilterRaw("[1]"), null);
    storage.setItem(key, "null");
    assert.equal(readStoredListFilters(key, storage), null);
  });

  it("keeps working when storage throws", () => {
    const broken = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
      removeItem() {
        throw new Error("blocked");
      },
    };
    const key = listFilterStorageKey(ITEM_LIST_FILTER_KEY, "4");
    assert.equal(readStoredListFilters(key, broken), null);
    assert.equal(writeStoredListFilters(key, { type: "buy" }, broken), false);
    assert.equal(removeStoredListFilters(key, broken), false);
    assert.equal(readStoredListFilters(null, memoryStorage()), null);
    assert.equal(writeStoredListFilters(null, {}, memoryStorage()), false);
  });
});

describe("item list filters", () => {
  it("drops unknown choices and a tag that is no longer in the list", () => {
    assert.deepEqual(
      sanitizeItemListFilters(
        { type: "buy", status: "nope", tag: "9", query: "  oak  ", extra: true },
        { tagIds: [3, "4"] }
      ),
      { type: "buy", status: "all", tag: "", query: "  oak  " }
    );
    assert.equal(sanitizeItemListFilters({ tag: "4" }, { tagIds: ["4"] }).tag, "4");
    assert.equal(sanitizeItemListFilters({ tag: "9" }).tag, "9");
    assert.deepEqual(sanitizeItemListFilters(["make"]), ITEM_LIST_DEFAULTS);
    assert.deepEqual(sanitizeItemListFilters(null), ITEM_LIST_DEFAULTS);
    const long = "x".repeat(250);
    assert.equal(sanitizeItemListFilters({ query: long }).query.length, 200);
  });

  it("treats the untouched list as inactive", () => {
    assert.equal(itemListFiltersActive(ITEM_LIST_DEFAULTS), false);
    assert.equal(itemListFiltersActive({ ...ITEM_LIST_DEFAULTS, query: "   " }), false);
    assert.equal(itemListFiltersActive({ ...ITEM_LIST_DEFAULTS, type: "make" }), true);
    assert.equal(itemListFiltersActive({ ...ITEM_LIST_DEFAULTS, status: "inactive" }), true);
    assert.equal(itemListFiltersActive({ ...ITEM_LIST_DEFAULTS, tag: "3" }), true);
    assert.equal(itemListFiltersActive({ ...ITEM_LIST_DEFAULTS, query: "oak" }), true);
  });
});

describe("batch list filters", () => {
  it("keeps a known status and search, and drops anything else", () => {
    assert.deepEqual(
      sanitizeBatchListFilters({ status: "complete", query: "lot" }),
      { status: "complete", query: "lot" }
    );
    assert.deepEqual(sanitizeBatchListFilters({ status: "archived" }), BATCH_LIST_DEFAULTS);
    assert.deepEqual(sanitizeBatchListFilters(null), BATCH_LIST_DEFAULTS);
    assert.equal(batchListFiltersActive(BATCH_LIST_DEFAULTS), false);
    assert.equal(batchListFiltersActive({ status: "queue", query: "a" }), true);
    assert.equal(batchListFiltersActive({ status: "all", query: "" }), true);
  });

  it("matches the open queue unless a status or search narrows it", () => {
    const rows = [
      { sku: "LOT-1", item_name: "Oak oil", status: "planned" },
      { sku: "LOT-2", item_name: "Tin", status: "in_progress" },
      { sku: "LOT-3", item_name: "Oak oil", status: "complete" },
      { sku: "LOT-4", item_name: "Cancelled run", status: "cancelled" },
      { sku: "LOT-5", item_name: "Bare", status: "" },
    ];
    const visible = (filters) => rows.filter((row) => batchMatchesListFilter(row, filters));
    assert.deepEqual(
      visible({ status: "queue", query: "" }).map((row) => row.sku),
      ["LOT-1", "LOT-2", "LOT-5"]
    );
    assert.deepEqual(
      visible({ status: "pending", query: "" }).map((row) => row.sku),
      ["LOT-1", "LOT-5"]
    );
    assert.deepEqual(
      visible({ status: "complete", query: "oak" }).map((row) => row.sku),
      ["LOT-3"]
    );
    assert.deepEqual(
      visible({ status: "queue", query: "TIN" }).map((row) => row.sku),
      ["LOT-2"]
    );
    assert.equal(visible({ status: "all", query: "" }).length, 5);
  });
});
