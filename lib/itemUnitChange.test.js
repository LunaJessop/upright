import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planItemUnitChange } from "./itemUnitChange.js";

const idle = {
  quantity: 0,
  plannedDelta: 0,
  goalMin: null,
  goalMax: null,
  purchaseLotCount: 0,
  productionSkuCount: 0,
  inventoryKnown: true,
  purchaseLotsKnown: true,
  canEditGoals: true,
};

describe("planItemUnitChange", () => {
  it("allows a save that keeps the same unit", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "fl_oz",
      nextUnit: "fl_oz",
      quantity: 128,
      purchaseLotCount: 2,
    });
    assert.deepEqual(result, {
      ok: true,
      goalUpdate: null,
      previousGoals: null,
    });
  });

  it("allows assigning a unit when the item never had one", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "",
      nextUnit: "oz",
      quantity: 4,
    });
    assert.equal(result.ok, true);
  });

  it("blocks a unit change that would reinterpret on-hand stock", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "fl_oz",
      nextUnit: "gal",
      quantity: 128,
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /stock on hand/);
    assert.match(result.error, /fl_oz/);
  });

  it("blocks a unit change while open batches use the item", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "lb",
      plannedDelta: -16,
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /Open batches/);
  });

  it("blocks a unit change while vendor lots exist", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "lb",
      purchaseLotCount: 1,
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /Vendor lot/);
  });

  it("blocks a unit change after production lots exist", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "ea",
      nextUnit: "lb",
      productionSkuCount: 1,
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /Production lots/);
  });

  it("blocks a unit change until inventory has loaded", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "lb",
      inventoryKnown: false,
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /hasn't loaded/);
  });

  it("allows a unit change when nothing is stored in the old unit", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "lb",
    });
    assert.deepEqual(result, {
      ok: true,
      goalUpdate: null,
      previousGoals: null,
    });
  });

  it("converts an inventory goal into the new unit", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "lb",
      goalMin: 16,
      goalMax: 32,
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.goalUpdate, { goal_min: 1, goal_max: 2 });
    assert.deepEqual(result.previousGoals, { goal_min: 16, goal_max: 32 });
  });

  it("refuses a goal conversion a non-admin cannot save", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "lb",
      goalMin: 16,
      goalMax: 32,
      canEditGoals: false,
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /admin/);
  });

  it("converts an inventory goal between ounces and grams", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "g",
      goalMin: 1,
      goalMax: 16,
    });
    assert.equal(result.ok, true);
    assert.ok(Math.abs(result.goalUpdate.goal_min - 28.349523125) < 1e-9);
    assert.ok(Math.abs(result.goalUpdate.goal_max - 453.59237) < 1e-9);
  });

  it("refuses a goal conversion across incompatible units", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "mL",
      goalMin: 1,
      goalMax: 2,
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /can't be converted/);
  });
});
