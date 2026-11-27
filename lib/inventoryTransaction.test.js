import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IN_REASONS,
  OUT_REASONS,
  addStock,
  emptyTransactionDraft,
  formatOnHandAfter,
  mergeTransactionPages,
  prepareManualTransaction,
  projectOnHand,
  reasonForDirection,
  reasonLabel,
  signedQuantityText,
  todayInputValue,
} from "./inventoryTransaction.js";

const today = "2026-11-26";

function prepare(overrides = {}) {
  return prepareManualTransaction({
    direction: "out",
    reason: "sold",
    quantityRaw: "2",
    unitPriceRaw: "",
    noteRaw: "",
    occurredOn: today,
    onHand: 10,
    today,
    ...overrides,
  });
}

describe("stock change reasons", () => {
  it("offers a different list for stock going out and stock coming in", () => {
    assert.deepEqual(
      OUT_REASONS.map((option) => option.value),
      ["sold", "gifted", "donated", "lost", "damaged", "stock_check", "other"]
    );
    assert.deepEqual(
      IN_REASONS.map((option) => option.value),
      ["returned", "found", "stock_check", "other"]
    );
    assert.equal(reasonLabel("sold"), "Sell");
    assert.equal(reasonLabel("returned"), "Return");
    assert.equal(reasonLabel("materials_used"), "Materials used");
    assert.equal(reasonLabel("unit_change"), "Unit change");
    assert.equal(reasonLabel("custom_reason"), "Custom Reason");
    assert.equal(reasonLabel(""), "—");
  });

  it("keeps a shared reason when the direction changes and replaces one that does not fit", () => {
    assert.equal(reasonForDirection("in", "stock_check"), "stock_check");
    assert.equal(reasonForDirection("in", "sold"), "returned");
    assert.equal(reasonForDirection("out", "found"), "sold");
  });
});

describe("prepareManualTransaction", () => {
  it("sends an out movement and leaves price and note empty when they are blank", () => {
    const result = prepare({ noteRaw: "   ", unitPriceRaw: " " });
    assert.equal(result.ok, true);
    assert.equal(result.resulting, 8);
    assert.deepEqual(result.payload, {
      direction: "out",
      reason: "sold",
      quantity: 2,
      unit_price: null,
      note: null,
      occurred_on: today,
    });
  });

  it("adds an in movement and keeps a zero price", () => {
    const result = prepare({
      direction: "in",
      reason: "found",
      quantityRaw: "0.2",
      unitPriceRaw: "0",
      noteRaw: "Back of the shelf",
      onHand: 0.1,
    });
    assert.equal(result.ok, true);
    assert.equal(result.resulting, 0.3);
    assert.equal(result.payload.unit_price, 0);
    assert.equal(result.payload.note, "Back of the shelf");
    assert.equal(result.payload.quantity, 0.2);
  });

  it("blocks an out that would pass below zero and still reports the result", () => {
    const result = prepare({ quantityRaw: "6", onHand: 5 });
    assert.equal(result.ok, false);
    assert.equal(result.overOnHand, true);
    assert.equal(result.error, "That would take stock below zero.");
    assert.equal(result.resulting, -1);
    assert.equal(result.payload, null);
    assert.equal(formatOnHandAfter(result.resulting, "oz"), "On hand after: −1 oz");
  });

  it("allows an out that uses the last of the stock", () => {
    const result = prepare({ quantityRaw: "5", onHand: "5.00" });
    assert.equal(result.ok, true);
    assert.equal(result.resulting, 0);
    assert.equal(formatOnHandAfter(0, "oz"), "On hand after: 0 oz");
  });

  it("rejects a future date, a negative price, and a note that is too long", () => {
    assert.equal(prepare({ occurredOn: "2026-11-27" }).error, "Date can't be in the future.");
    assert.equal(prepare({ unitPriceRaw: "-1" }).error, "Price must be zero or more.");
    assert.equal(prepare({ noteRaw: "x".repeat(501) }).code, "note");
    assert.equal(prepare({ quantityRaw: "" }).code, "quantity");
    assert.equal(prepare({ direction: "in", reason: "sold" }).code, "reason");
  });

  it("projects stock only for a positive amount", () => {
    assert.equal(projectOnHand({ onHand: 4, direction: "out", quantityRaw: "" }), null);
    assert.equal(projectOnHand({ onHand: 4, direction: "in", quantityRaw: "1" }).resulting, 5);
    assert.equal(addStock(10.5, "-0.25"), 10.25);
  });
});

describe("history rows", () => {
  it("formats a signed quantity and keeps the local calendar day", () => {
    assert.equal(
      signedQuantityText({ quantity_change: -2, quantity: 2, direction: "out", unit_of_measure: "oz" }),
      "−2 oz"
    );
    assert.equal(
      signedQuantityText({ quantity_change: 1.5, quantity: 1.5, direction: "in", unit_of_measure: "fl oz" }),
      "+1.5 fl oz"
    );
    assert.equal(
      signedQuantityText({ quantity_change: 0, quantity: 4, direction: "in", unit_of_measure: "ea" }),
      "0 ea"
    );
    assert.equal(todayInputValue(new Date(2026, 10, 26)), "2026-11-26");
    assert.equal(emptyTransactionDraft("2026-11-26").direction, "out");
    assert.equal(emptyTransactionDraft("2026-11-26").reason, "sold");
  });

  it("appends the next page without repeating a row", () => {
    const merged = mergeTransactionPages(
      [{ id: 3 }, { id: 2 }],
      [{ id: 2 }, { id: 1 }]
    );
    assert.deepEqual(merged.map((row) => row.id), [3, 2, 1]);
  });
});
