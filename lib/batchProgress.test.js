import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyProgressSave,
  enteredExceedsAllocated,
  enteredQuantityFor,
  parseEnteredQuantity,
  progressErrorMessage,
  progressSaveResult,
} from "./batchProgress.js";

describe("entered ingredient quantity", () => {
  it("accepts zero and up to 6 decimal places, and rejects partial numbers", () => {
    assert.equal(parseEnteredQuantity("0"), "0");
    assert.equal(parseEnteredQuantity(" 1.5 "), "1.5");
    assert.equal(parseEnteredQuantity("4.000001"), "4.000001");
    assert.equal(parseEnteredQuantity("1."), null);
    assert.equal(parseEnteredQuantity(".5"), null);
    assert.equal(parseEnteredQuantity("-1"), null);
    assert.equal(parseEnteredQuantity("4.0000001"), null);
    assert.equal(enteredExceedsAllocated("4", "4"), false);
    assert.equal(enteredExceedsAllocated("4.1", "4"), true);
  });

  it("uses zero when that step has no saved progress", () => {
    const progress = [
      { batch_phase_id: 15, quantity_entered: "1.5" },
      { batch_phase_id: null, quantity_entered: "0" },
    ];
    assert.equal(enteredQuantityFor(progress, 15), "1.5");
    assert.equal(enteredQuantityFor(progress, null), "0");
    assert.equal(enteredQuantityFor(progress, 99), "0");
    assert.equal(enteredQuantityFor(undefined, 15), "0");
  });

  it("ignores a late save and does not call a newer draft saved", () => {
    const late = progressSaveResult({
      requestId: 1,
      activeRequestId: 2,
      sent: "1",
      draft: "2",
      result: { quantity_entered: "1" },
    });
    assert.equal(late.apply, false);

    const current = progressSaveResult({
      requestId: 2,
      activeRequestId: 2,
      sent: "1.5",
      draft: "1.5",
      result: { quantity_entered: "1.5" },
    });
    assert.equal(current.status, "saved");
    assert.equal(current.value, "1.5");

    const stillTyping = progressSaveResult({
      requestId: 2,
      activeRequestId: 2,
      sent: "1",
      draft: "1.2",
      result: { quantity_entered: "1" },
    });
    assert.equal(stillTyping.status, "idle");
    assert.equal(stillTyping.value, "1.2");
  });

  it("keeps the setup error and stores the returned amount on the ingredient row", () => {
    assert.equal(
      progressErrorMessage({ status: 503, code: "PROGRESS_UNAVAILABLE", message: "Ingredient progress is not set up yet." }),
      "Ingredient progress is not set up yet."
    );
    const next = applyProgressSave(
      {
        id: 7,
        quantity: 2,
        components: [
          { id: 11, quantity_allocated: "12", unit_of_measure: "fl_oz", progress: [] },
          { id: 12, quantity_allocated: "2", progress: [] },
        ],
      },
      { batch_component_id: 11, batch_phase_id: 1, quantity_entered: "1.5" }
    );
    assert.equal(next.quantity, 2);
    assert.equal(next.components[0].quantity_allocated, "12");
    assert.deepEqual(next.components[0].progress, [
      { batch_phase_id: 1, quantity_entered: "1.5" },
    ]);
    assert.deepEqual(next.components[1].progress, []);
  });
});
