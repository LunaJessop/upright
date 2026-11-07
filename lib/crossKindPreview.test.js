import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeCrossKindPreview,
  summarizeCrossKindCounts,
} from "./crossKindPreview.js";

const preview = {
  fromUnit: "fl_oz",
  toUnit: "ea",
  counts: { stock: 2, recipes: 2, batches: 1 },
  stock: {
    quantity: { before: 16, after: 2 },
    goalMin: { before: 8, after: 1 },
    goalMax: { before: null, after: null },
    unitCost: { before: 1, after: 8 },
    unitSellPrice: { before: 2, after: 16 },
    purchaseLots: [
      {
        id: 4,
        lotNumber: "L1",
        quantity: { before: 8, after: 1 },
        unitCost: { before: 0.5, after: 4 },
      },
    ],
  },
  recipes: [
    {
      parentName: "QA TEST Serum",
      before: 8,
      after: 1,
      unitBefore: "fl_oz",
      unitAfter: "ea",
    },
  ],
  ownRecipe: [
    { componentName: "QA TEST Alcohol", unit: "fl_oz", before: 2, after: 16 },
  ],
  batches: [
    {
      batchId: 9,
      sku: "QA-BATCH",
      role: "finished",
      before: 8,
      after: 1,
      unitBefore: "fl_oz",
      unitAfter: "ea",
    },
  ],
};

describe("describeCrossKindPreview", () => {
  it("summarizes the server counts", () => {
    assert.equal(
      summarizeCrossKindCounts({ stock: 1, recipes: 1, batches: 0 }),
      "1 stock record, 1 recipe line, 0 batches"
    );
  });

  it("shows stock, recipes, the item's own recipe, and batches", () => {
    const view = describeCrossKindPreview(preview);
    assert.equal(view.summary, "2 stock records, 2 recipe lines, 1 batch");
    assert.equal(view.fromLabel, "fl oz");
    assert.equal(view.toLabel, "each");
    assert.match(view.stockLines[0].value, /16 fl oz → 2 each/);
    assert.match(view.stockLines.find((row) => row.label === "Unit cost").value, /\$1\.00 → \$8\.00/);
    assert.match(view.lots[0].value, /8 fl oz → 1 each/);
    assert.equal(view.recipes[0].label, "QA TEST Serum");
    assert.match(view.ownRecipe[0].value, /2 fl oz → 16 fl oz/);
    assert.match(view.batches[0].label, /QA-BATCH/);
    assert.match(view.batches[0].value, /8 fl oz → 1 each/);
  });
});
