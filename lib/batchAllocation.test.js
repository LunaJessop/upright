import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allocationQuantityUnit } from "./batchAllocation.js";
import { formatReadableQuantity, friendlyUnitLabel } from "./formatQuantity.js";

describe("allocationQuantityUnit", () => {
  it("labels an open batch allocation in the stock unit, not the recipe unit", () => {
    assert.equal(
      allocationQuantityUnit({
        batchStatus: "planned",
        recordedUnit: "oz",
        stockUnit: "lb",
      }),
      "lb"
    );
    assert.equal(
      allocationQuantityUnit({
        batchStatus: "in_progress",
        recordedUnit: "mL",
        stockUnit: "L",
      }),
      "L"
    );
  });

  it("keeps the recorded unit when the batch is already finished", () => {
    assert.equal(
      allocationQuantityUnit({
        batchStatus: "complete",
        recordedUnit: "oz",
        stockUnit: "lb",
      }),
      "oz"
    );
    assert.equal(
      allocationQuantityUnit({
        batchStatus: "cancelled",
        recordedUnit: "fl_oz",
        stockUnit: "gal",
      }),
      "fl_oz"
    );
  });

  it("uses the recorded unit when it already matches stock", () => {
    assert.equal(
      allocationQuantityUnit({
        batchStatus: "planned",
        recordedUnit: "lb",
        stockUnit: "lb",
      }),
      "lb"
    );
  });

  it("shows one pound, not one ounce, for an open allocation of 1 lb recorded as oz", () => {
    const unit = allocationQuantityUnit({
      batchStatus: "planned",
      recordedUnit: "oz",
      stockUnit: "lb",
    });
    assert.equal(formatReadableQuantity(1, unit), "1 lb");
    assert.equal(friendlyUnitLabel(unit), "lb");
  });

  it("falls back to the recorded unit when stock has not loaded", () => {
    assert.equal(
      allocationQuantityUnit({
        batchStatus: "planned",
        recordedUnit: "oz",
        stockUnit: "",
      }),
      "oz"
    );
  });
});
