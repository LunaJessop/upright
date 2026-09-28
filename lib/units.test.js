import assert from "node:assert/strict";
import test from "node:test";
import { compatibleUnits, convertQuantity, unitsAreCompatible } from "./units.js";

const weightAndVolume = [
  { value: "oz", label: "Ounce (oz)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "g", label: "Gram (g)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "fl_oz", label: "Fluid ounce (fl oz)" },
  { value: "gal", label: "Gallon (gal)" },
  { value: "mL", label: "Milliliter (mL)" },
  { value: "L", label: "Liter (L)" },
  { value: "ea", label: "Each (ea)" },
];

function close(actual, expected) {
  assert.equal(typeof actual, "number");
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `expected ${expected}, got ${actual}`
  );
}

test("weight uses the exact avoirdupois bridge", () => {
  close(convertQuantity(1, "oz", "g"), 28.349523125);
  close(convertQuantity(1, "lb", "kg"), 0.45359237);
  close(convertQuantity(16, "oz", "g"), 453.59237);
  assert.equal(convertQuantity(16, "oz", "lb"), 1);
  assert.equal(convertQuantity(1, "lb", "oz"), 16);
});

test("volume uses the exact US gallon bridge", () => {
  close(convertQuantity(1, "fl_oz", "mL"), 29.5735295625);
  close(convertQuantity(1, "gal", "mL"), 3785.411784);
  close(convertQuantity(128, "fl_oz", "mL"), 3785.411784);
  assert.equal(convertQuantity(128, "fl_oz", "gal"), 1);
  assert.equal(convertQuantity(6, "tsp", "fl_oz"), 1);
});

test("weight does not convert to volume, and each stays separate", () => {
  assert.equal(convertQuantity(1, "oz", "mL"), null);
  assert.equal(convertQuantity(1, "g", "fl_oz"), null);
  assert.equal(convertQuantity(1, "lb", "L"), null);
  assert.equal(convertQuantity(1, "ea", "oz"), null);
  assert.equal(convertQuantity(1, "ea", "g"), null);
  assert.equal(unitsAreCompatible("oz", "g"), true);
  assert.equal(unitsAreCompatible("fl_oz", "mL"), true);
  assert.equal(unitsAreCompatible("oz", "mL"), false);
  assert.equal(unitsAreCompatible("ea", "oz"), false);
});

test("a recipe stocked in ounces can also be entered in grams", () => {
  assert.deepEqual(
    compatibleUnits("oz", weightAndVolume).map((opt) => opt.value),
    ["oz", "lb", "g", "kg"]
  );
  assert.deepEqual(
    compatibleUnits("fl_oz", weightAndVolume).map((opt) => opt.value),
    ["fl_oz", "gal", "mL", "L"]
  );
  assert.deepEqual(
    compatibleUnits("ea", weightAndVolume).map((opt) => opt.value),
    ["ea"]
  );
});
