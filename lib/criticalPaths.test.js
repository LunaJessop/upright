import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mergeInventorySave,
  validateInventoryEdit,
} from "./inventoryEdit.js";
import { componentStockMultiplier } from "./units.js";

describe("componentStockMultiplier", () => {
  it("converts a lb recipe line into oz stock units before scaling children", () => {
    // 1 lb dough per loaf, dough stocked in oz, batch of 10 loaves → 160 oz
    assert.equal(componentStockMultiplier(1, "lb", "oz", 10), 160);
  });

  it("scales same-unit lines by the parent multiplier only", () => {
    assert.equal(componentStockMultiplier(0.6, "oz", "oz", 160), 96);
  });

  it("treats a missing line unit as already in stock units", () => {
    assert.equal(componentStockMultiplier(2, "", "ea", 4), 8);
  });

  it("returns null when the line unit cannot be converted", () => {
    assert.equal(componentStockMultiplier(1, "lb", "mL", 3), null);
  });
});

describe("validateInventoryEdit", () => {
  it("rejects an invalid goal range before a quantity would be written", () => {
    const result = validateInventoryEdit({
      quantityRaw: "80",
      goalMinRaw: "10",
      goalMaxRaw: "",
      editGoals: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.error, "Goal max must be ≥ goal min.");
  });

  it("accepts a quantity-only edit when goals are blank", () => {
    const result = validateInventoryEdit({
      quantityRaw: "80",
      goalMinRaw: "",
      goalMaxRaw: "",
      editGoals: true,
    });
    assert.deepEqual(result, { ok: true, quantity: 80, goals: null });
  });

  it("rejects a negative quantity", () => {
    const result = validateInventoryEdit({
      quantityRaw: "-1",
      editGoals: false,
    });
    assert.equal(result.ok, false);
  });

  it("returns both quantity and goals when the range is valid", () => {
    const result = validateInventoryEdit({
      quantityRaw: "80",
      goalMinRaw: "10",
      goalMaxRaw: "40",
      editGoals: true,
    });
    assert.deepEqual(result, {
      ok: true,
      quantity: 80,
      goals: { goal_min: 10, goal_max: 40 },
    });
  });
});

describe("mergeInventorySave", () => {
  it("keeps the quantity just written when the goal payload omits it", () => {
    const merged = mergeInventorySave(
      { quantity: 80, planned_quantity: 90 },
      { goal_min: 10, goal_max: 40 }
    );
    assert.equal(merged.quantity, 80);
    assert.equal(merged.planned_quantity, 90);
    assert.equal(merged.goal_min, 10);
    assert.equal(merged.goal_max, 40);
  });
});
