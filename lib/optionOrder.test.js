import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareText, sortByText } from "./optionOrder.js";

describe("sortByText", () => {
  it("sorts labels A to Z without caring about case", () => {
    const sorted = sortByText(
      [
        { name: "QA TEST Jojoba" },
        { name: "alpha wax" },
        { name: "QA TEST Face Oil" },
      ],
      (row) => row.name
    );
    assert.deepEqual(
      sorted.map((row) => row.name),
      ["alpha wax", "QA TEST Face Oil", "QA TEST Jojoba"]
    );
  });

  it("does not mutate the original list", () => {
    const items = [{ name: "b" }, { name: "a" }];
    sortByText(items, (row) => row.name);
    assert.equal(items[0].name, "b");
  });

  it("treats blank labels as empty text", () => {
    assert.equal(compareText(null, ""), 0);
  });
});
