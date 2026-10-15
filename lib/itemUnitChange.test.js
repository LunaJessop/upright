import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  planStockUnitChange,
  priceAfterUnitChange,
  scalePerUnitPrice,
  scaleRecipeQuantities,
} from "./itemUnitChange.js";

describe("planStockUnitChange", () => {
  it("keeps the same unit on the normal item save", () => {
    assert.deepEqual(planStockUnitChange("lb", "lb"), {
      action: "keep",
      unitOfMeasure: "lb",
    });
  });

  it("lets the normal save set the first unit", () => {
    assert.deepEqual(planStockUnitChange("", "oz"), {
      action: "keep",
      unitOfMeasure: "oz",
    });
  });

  it("sends a real unit change to the change-unit endpoint", () => {
    const plan = planStockUnitChange("lb", "oz");
    assert.equal(plan.action, "change");
    assert.equal(plan.unitOfMeasure, "oz");
    assert.equal(plan.factor, 16);
  });

  it("converts grams to ounces with the shared factor", () => {
    const plan = planStockUnitChange("g", "oz");
    assert.equal(plan.action, "change");
    assert.ok(Math.abs(plan.factor - 1 / 28.349523125) < 1e-12);
  });

  it("refuses to turn weight into volume", () => {
    const plan = planStockUnitChange("lb", "fl_oz");
    assert.equal(plan.action, "reject");
    assert.match(plan.error, /lb/);
    assert.match(plan.error, /fl oz/);
    assert.equal(plan.error.includes("fl_oz"), false);
  });

  it("refuses to clear a unit that already has stock to convert", () => {
    const plan = planStockUnitChange("lb", "");
    assert.equal(plan.action, "reject");
    assert.match(plan.error, /lb/);
  });
});

describe("priceAfterUnitChange", () => {
  it("keeps the price the server converted when the form was not edited", () => {
    assert.equal(priceAfterUnitChange("16", "16", "1", 16), "1");
    assert.equal(priceAfterUnitChange(16, "16.00", 1, 16), "1");
  });

  it("scales a price edited in the old unit", () => {
    assert.equal(priceAfterUnitChange("16", "32", "1", 16), "2");
    assert.equal(scalePerUnitPrice("1.50", 16), "0.09375");
  });

  it("leaves a blank price blank", () => {
    assert.equal(priceAfterUnitChange(null, "", null, 16), "");
    assert.equal(priceAfterUnitChange("", "8", null, 16), "0.5");
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
    const toCups = scaleRecipeQuantities(
      [{ quantity: "2" }],
      "gal",
      "cup"
    );
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
    const result = scaleRecipeQuantities(
      [{ quantity: "2" }],
      "",
      "gal"
    );
    assert.equal(result.ok, true);
    assert.equal(result.lines[0].quantity, "2");
  });

  it("refuses to clear or leave the measurement system while a recipe exists", () => {
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
