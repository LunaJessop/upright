import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { HELP_LABELS, HELP_TEXT } from "./helpText.js";

const BOM_COPY =
  "BOM (bill of materials) is the recipe list: everything that goes into making one of this item.";

const PLACEMENTS = {
  bom: [
    "app/items/[id]/components/BomSection.jsx",
    "app/batches/[id]/page.jsx",
    "components/BomRecipeEditor.jsx",
  ],
  usedIn: ["app/items/[id]/page.jsx"],
  productionPhases: [
    "app/items/[id]/components/ProductionPhasesSection.jsx",
    "app/batches/[id]/page.jsx",
    "components/RouterPhaseEditor.jsx",
  ],
  batches: ["app/items/[id]/components/BatchesSection.jsx"],
  batchReceipt: ["app/batches/[id]/page.jsx"],
  plannedQty: [
    "app/items/[id]/components/InventorySection.jsx",
    "app/items/inventory/page.jsx",
  ],
  goal: [
    "app/items/[id]/components/InventorySection.jsx",
    "app/items/inventory/page.jsx",
  ],
  makeVsBuy: [
    "app/items/[id]/components/EditItemModal.jsx",
    "app/items/new-item/page.jsx",
    "app/items/[id]/components/ItemDetailHeader.jsx",
  ],
  routers: ["app/settings/routers/page.jsx"],
};

function source(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

describe("HELP_TEXT", () => {
  it("uses the bill of materials sentence from the request", () => {
    assert.equal(HELP_TEXT.bom, BOM_COPY);
  });

  it("gives every topic a short note and a screen-reader name", () => {
    const keys = Object.keys(HELP_TEXT);
    assert.deepEqual(Object.keys(HELP_LABELS).sort(), [...keys].sort());
    for (const key of keys) {
      assert.equal(typeof HELP_TEXT[key], "string");
      assert.ok(HELP_TEXT[key].trim().length > 20, key);
      assert.match(HELP_LABELS[key], /^Help: /);
      assert.equal(HELP_TEXT[key].includes("title="), false);
    }
  });

  it("is wired next to each confusing label", () => {
    for (const [key, files] of Object.entries(PLACEMENTS)) {
      for (const file of files) {
        const text = source(file);
        assert.match(text, new RegExp(`HELP_TEXT\\.${key}\\b`), `${file} missing ${key}`);
        assert.match(text, new RegExp(`HELP_LABELS\\.${key}\\b`), `${file} missing label ${key}`);
      }
    }
  });
});
