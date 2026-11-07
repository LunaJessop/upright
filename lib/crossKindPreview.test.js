import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeCrossKindPreview,
  previewCrossKindWithDraft,
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

describe("previewCrossKindWithDraft", () => {
  const serverPreview = {
    fromUnit: "fl_oz",
    toUnit: "ea",
    factor: 8,
    stock: {
      quantity: { before: 16, after: 2 },
      unitCost: { before: 1, after: 8 },
      unitSellPrice: { before: 4, after: 32 },
    },
    ownRecipe: [
      {
        componentItemId: 6,
        componentName: "Oil",
        unit: "oz",
        before: 2,
        after: 16,
      },
    ],
    recipes: [{ parentName: "Soap", before: 16, after: 2 }],
  };

  it("keeps the server preview when the open draft matches the database", () => {
    const shown = previewCrossKindWithDraft(serverPreview, {
      savedUnitCost: "1",
      savedUnitSellPrice: "4",
      draft: { unit_cost: "1", unit_sell_price: "4" },
      lines: [{ itemId: "6", quantity: "2", unitOfMeasure: "oz" }],
      factor: 8,
    });
    assert.equal(shown.stock.unitCost.after, 8);
    assert.equal(shown.ownRecipe[0].componentName, "Oil");
    assert.equal(shown.ownRecipe[0].after, 16);
    assert.equal(shown.recipes[0].parentName, "Soap");
    assert.equal(shown.stock.quantity.after, 2);
  });

  it("shows an unsaved price and recipe edit scaled once, not the database row", () => {
    const shown = previewCrossKindWithDraft(serverPreview, {
      savedUnitCost: "1",
      savedUnitSellPrice: "4",
      draft: { unit_cost: "2", unit_sell_price: "4" },
      lines: [
        {
          itemId: "6",
          quantity: "3",
          unitOfMeasure: "oz",
          componentName: "Oil",
        },
      ],
      factor: 8,
    });
    assert.equal(shown.stock.unitCost.after, 16);
    assert.equal(shown.stock.unitSellPrice.after, 32);
    assert.equal(shown.ownRecipe[0].before, 3);
    assert.equal(shown.ownRecipe[0].after, 24);
    assert.equal(shown.ownRecipe[0].componentName, "Oil");
    assert.equal(serverPreview.ownRecipe[0].after, 16);
  });
});
