import assert from "node:assert/strict";
import test from "node:test";
import { resolveBomTreeQuantity } from "./bomTreeQuantity.js";

test("16 oz on a component stocked in lb is 1 lb before it scales children", () => {
  const dough = resolveBomTreeQuantity(
    { quantity: 16, unit_of_measure: "oz" },
    { unit_of_measure: "lb", make_or_buy: "make" },
    1
  );

  assert.equal(dough.enteredQty, 16);
  assert.equal(dough.enteredUnit, "oz");
  assert.equal(dough.perParentStock, 1);
  assert.equal(dough.rolledUp, 1);
  assert.equal(dough.displayUnit, "lb");
  assert.equal(dough.childMultiplier, 1);
  assert.equal(dough.unitsDiffer, true);
  assert.deepEqual(dough.flags, []);

  const salt = resolveBomTreeQuantity(
    { quantity: 2, unit_of_measure: "oz" },
    { unit_of_measure: "oz" },
    dough.childMultiplier
  );
  assert.equal(salt.rolledUp, 2);
  assert.equal(salt.displayUnit, "oz");
});

test("nested 16 oz flour under 2 lb of dough rolls up to 2 lb, not 32 oz", () => {
  const dough = resolveBomTreeQuantity(
    { quantity: 2, unit_of_measure: "lb" },
    { unit_of_measure: "lb", make_or_buy: "make" },
    1
  );
  const flour = resolveBomTreeQuantity(
    { quantity: 16, unit_of_measure: "oz" },
    { unit_of_measure: "lb" },
    dough.childMultiplier
  );

  assert.equal(flour.perParentStock, 1);
  assert.equal(flour.rolledUp, 2);
  assert.equal(flour.displayUnit, "lb");
  assert.equal(flour.childMultiplier, 2);
});

test("batch quantity scales the converted stock amount", () => {
  const flour = resolveBomTreeQuantity(
    { quantity: 16, unit_of_measure: "oz" },
    { unit_of_measure: "lb" },
    3
  );
  assert.equal(flour.perParentStock, 1);
  assert.equal(flour.rolledUp, 3);
});

test("same unit multiplies without a conversion flag", () => {
  const line = resolveBomTreeQuantity(
    { quantity: "4", unit_of_measure: "ea" },
    { unit_of_measure: "ea" },
    2
  );
  assert.equal(line.rolledUp, 8);
  assert.equal(line.unitsDiffer, false);
  assert.deepEqual(line.flags, []);
});

test("missing line unit is treated as the stock unit", () => {
  const line = resolveBomTreeQuantity(
    { quantity: 5, unit_of_measure: null },
    { unit_of_measure: "lb" },
    2
  );
  assert.equal(line.rolledUp, 10);
  assert.equal(line.displayUnit, "lb");
  assert.deepEqual(line.flags, []);
});

test("missing stock unit keeps the entered unit and flags the line", () => {
  const line = resolveBomTreeQuantity(
    { quantity: 16, unit_of_measure: "oz" },
    { unit_of_measure: "" },
    2
  );
  assert.equal(line.rolledUp, 32);
  assert.equal(line.displayUnit, "oz");
  assert.deepEqual(line.flags, ["No stock unit"]);
});

test("missing both units still shows the quantity and flags the line", () => {
  const line = resolveBomTreeQuantity(
    { quantity: 4 },
    {},
    1
  );
  assert.equal(line.rolledUp, 4);
  assert.equal(line.displayUnit, "");
  assert.deepEqual(line.flags, ["No unit"]);
});

test("incompatible units do not scale and do not feed children a fake multiplier", () => {
  const spice = resolveBomTreeQuantity(
    { quantity: 3, unit_of_measure: "oz" },
    { unit_of_measure: "ea", make_or_buy: "make" },
    2
  );
  assert.equal(spice.perParentStock, null);
  assert.equal(spice.rolledUp, null);
  assert.equal(spice.childMultiplier, null);
  assert.equal(spice.enteredQty, 3);
  assert.equal(spice.enteredUnit, "oz");
  assert.deepEqual(spice.flags, ["Can't convert oz to ea"]);

  const child = resolveBomTreeQuantity(
    { quantity: 1, unit_of_measure: "ea" },
    { unit_of_measure: "ea" },
    spice.childMultiplier
  );
  assert.equal(child.rolledUp, null);
  assert.equal(child.perParentStock, 1);
  assert.ok(
    child.flags.includes("Can't roll up — a parent line couldn't be converted")
  );
});

test("a non-numeric quantity is flagged instead of multiplied", () => {
  const line = resolveBomTreeQuantity(
    { quantity: "lots", unit_of_measure: "lb" },
    { unit_of_measure: "lb" },
    4
  );
  assert.equal(line.rolledUp, null);
  assert.equal(line.childMultiplier, null);
  assert.equal(line.enteredQty, "lots");
  assert.deepEqual(line.flags, ["Quantity isn't a number"]);
});

test("fluid ounces convert into the stock gallon before multiplying", () => {
  const water = resolveBomTreeQuantity(
    { quantity: 8, unit_of_measure: "fl_oz" },
    { unit_of_measure: "gal" },
    2
  );
  assert.equal(water.perParentStock, 0.0625);
  assert.equal(water.rolledUp, 0.125);
  assert.equal(water.displayUnit, "gal");
});
