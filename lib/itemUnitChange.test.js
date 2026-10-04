import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  planItemUnitChange,
  restateUnitPrice,
  scaleRecipeQuantities,
} from "./itemUnitChange.js";

const idle = {
  plannedDelta: 0,
  productionSkuCount: 0,
  inventoryKnown: true,
};

describe("planItemUnitChange", () => {
  it("allows a save that keeps the same unit", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "fl_oz",
      nextUnit: "fl_oz",
    });
    assert.deepEqual(result, { ok: true, unitChanging: false });
  });

  it("allows assigning a unit when the item never had one", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "",
      nextUnit: "oz",
    });
    assert.equal(result.ok, true);
    assert.equal(result.unitChanging, false);
  });

  it("allows a compatible change while stock, lots, and goals exist", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "gal",
      nextUnit: "cup",
    });
    assert.deepEqual(result, { ok: true, unitChanging: true });
  });

  it("allows ounces to become grams", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "g",
    });
    assert.equal(result.ok, true);
    assert.equal(result.unitChanging, true);
  });

  it("blocks a unit that cannot be converted", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "mL",
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /can't be converted/);
  });

  it("blocks clearing a unit", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
      nextUnit: "",
    });
    assert.equal(result.ok, false);
    assert.match(result.error, /Clearing the unit/);
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

  it("blocks a unit change after production lots exist", () => {
    const result = planItemUnitChange({
      ...idle,
      previousUnit: "oz",
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
});

describe("scaleRecipeQuantities", () => {
  it("restates a per-gallon recipe when the parent is stocked in cups", () => {
    const result = scaleRecipeQuantities(
      [{ id: 1, quantity: "2", unitOfMeasure: "cup" }],
      "gal",
      "cup"
    );
    assert.equal(result.ok, true);
    assert.equal(result.factor, 0.0625);
    assert.equal(result.lines[0].quantity, "0.125");
    assert.equal(result.lines[0].unitOfMeasure, "cup");
  });

  it("round-trips cups back to gallons", () => {
    const toCups = scaleRecipeQuantities([{ quantity: "2" }], "gal", "cup");
    const back = scaleRecipeQuantities(toCups.lines, "cup", "gal");
    assert.equal(back.ok, true);
    assert.equal(back.lines[0].quantity, "2");
  });

  it("restates an ounce recipe when the parent moves to grams", () => {
    const result = scaleRecipeQuantities(
      [{ quantity: "1", unitOfMeasure: "oz" }],
      "oz",
      "g"
    );
    assert.equal(result.ok, true);
    const qty = Number(result.lines[0].quantity);
    assert.ok(Math.abs(qty - 1 / 28.349523125) < 1e-9);
  });

  it("does not rescale when a unit is chosen for the first time", () => {
    const result = scaleRecipeQuantities([{ quantity: "2" }], "", "gal");
    assert.equal(result.ok, true);
    assert.equal(result.lines[0].quantity, "2");
  });

  it("refuses to clear or leave the measurement while a recipe exists", () => {
    const cleared = scaleRecipeQuantities([{ quantity: "2" }], "gal", "");
    assert.equal(cleared.ok, false);
    assert.match(cleared.error, /per gal/);

    const each = scaleRecipeQuantities([{ quantity: "2" }], "gal", "ea");
    assert.equal(each.ok, false);
    assert.match(each.error, /per ea/);
  });

  it("leaves an empty recipe unchanged", () => {
    const result = scaleRecipeQuantities([], "gal", "ea");
    assert.deepEqual(result, { ok: true, lines: [], factor: 1 });
  });
});

describe("restateUnitPrice", () => {
  it("turns a per-gallon price into a per-cup price", () => {
    assert.equal(restateUnitPrice("128", "gal", "cup"), "8");
    assert.equal(restateUnitPrice("32", "lb", "oz"), "2");
  });

  it("leaves a blank or same-unit price alone", () => {
    assert.equal(restateUnitPrice("", "gal", "cup"), "");
    assert.equal(restateUnitPrice("10", "lb", "lb"), "10");
    assert.equal(restateUnitPrice("10", "oz", "mL"), "10");
  });
});
