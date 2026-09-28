import assert from "node:assert/strict";
import test from "node:test";
import {
  bomTreeFlagActions,
  bomTreeQuantityReadout,
  resolveBomTreeQuantity,
} from "./bomTreeQuantity.js";
import { formatReadableQuantity, formatStockNote } from "./formatQuantity.js";

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
    { id: 3, name: "Bread flour", unit_of_measure: "" },
    2
  );
  assert.equal(line.rolledUp, 32);
  assert.equal(line.displayUnit, "oz");
  assert.equal(line.flags.length, 1);
  assert.equal(line.flags[0].code, "missing_stock_unit");
  assert.match(line.flags[0].message, /Bread flour has no stock unit/);
  assert.match(line.flags[0].message, /stays in oz/);
  assert.deepEqual(
    bomTreeFlagActions(
      line.flags[0],
      { id: 2, name: "Dough" },
      { id: 3, name: "Bread flour" }
    ),
    [
      { href: "/items/3?edit=1#edit-stock-unit", label: "Change stock unit" },
      { href: "/items/2?edit=1#edit-bom", label: "Edit this BOM line" },
    ]
  );
});

test("missing both units still shows the quantity and flags the line", () => {
  const line = resolveBomTreeQuantity(
    { quantity: 4 },
    { id: 9, name: "Widget" },
    1
  );
  assert.equal(line.rolledUp, 4);
  assert.equal(line.displayUnit, "");
  assert.equal(line.flags[0].code, "missing_unit");
  assert.match(line.flags[0].message, /Widget has no stock unit/);
  assert.deepEqual(
    bomTreeFlagActions(line.flags[0], { id: 1 }, { id: 9, name: "Widget" }),
    [
      { href: "/items/1?edit=1#edit-bom", label: "Edit this BOM line" },
      { href: "/items/9?edit=1#edit-stock-unit", label: "Change stock unit" },
    ]
  );
});

test("incompatible units do not scale and do not feed children a fake multiplier", () => {
  const spice = resolveBomTreeQuantity(
    { quantity: 3, unit_of_measure: "oz" },
    { id: 5, name: "Chili flake", unit_of_measure: "ea", make_or_buy: "make" },
    2
  );
  assert.equal(spice.perParentStock, null);
  assert.equal(spice.rolledUp, null);
  assert.equal(spice.childMultiplier, null);
  assert.equal(spice.enteredQty, 3);
  assert.equal(spice.enteredUnit, "oz");
  assert.deepEqual(spice.flags, [
    {
      code: "unit_mismatch",
      message:
        "Unit mismatch: this line is in oz, but Chili flake is stocked in each, so it can't be scaled. Edit this BOM line or change the item's stock unit.",
    },
  ]);
  assert.deepEqual(
    bomTreeFlagActions(
      spice.flags[0],
      { id: 2, name: "Dough" },
      { id: 5, name: "Chili flake", unit_of_measure: "ea" }
    ),
    [
      { href: "/items/2?edit=1#edit-bom", label: "Edit this BOM line" },
      { href: "/items/5?edit=1#edit-stock-unit", label: "Change stock unit" },
    ]
  );

  const child = resolveBomTreeQuantity(
    { quantity: 1, unit_of_measure: "ea" },
    { unit_of_measure: "ea" },
    spice.childMultiplier
  );
  assert.equal(child.rolledUp, null);
  assert.equal(child.perParentStock, 1);
  assert.equal(child.flags[0].code, "parent_blocked");
  assert.match(child.flags[0].message, /parent line/);
  assert.deepEqual(bomTreeFlagActions(child.flags[0], { id: 5 }, { id: 8 }), []);
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
  assert.equal(line.flags[0].code, "non_numeric");
  assert.match(line.flags[0].message, /says "lots"/);
  assert.deepEqual(bomTreeFlagActions(line.flags[0], { id: 2 }, { id: 3 }), [
    { href: "/items/2?edit=1#edit-bom", label: "Edit this BOM line" },
  ]);
});

test("nested scaling matches componentStockMultiplier for a lb line stocked in oz", () => {
  const dough = resolveBomTreeQuantity(
    { quantity: 1, unit_of_measure: "lb" },
    { unit_of_measure: "oz", make_or_buy: "make" },
    10
  );
  assert.equal(dough.perParentStock, 16);
  assert.equal(dough.rolledUp, 160);
  assert.equal(dough.childMultiplier, 160);
  assert.deepEqual(dough.flags, []);

  const salt = resolveBomTreeQuantity(
    { quantity: 0.6, unit_of_measure: "oz" },
    { unit_of_measure: "oz" },
    dough.childMultiplier
  );
  assert.equal(salt.rolledUp, 96);
});

test("grams on an ounce-stocked component total in ounces", () => {
  const spice = resolveBomTreeQuantity(
    { quantity: 100, unit_of_measure: "g" },
    { name: "QA TEST Ounce spice", unit_of_measure: "oz" },
    2
  );
  const perParent = 100 / 28.349523125;
  assert.ok(Math.abs(spice.perParentStock - perParent) < 1e-9);
  assert.ok(Math.abs(spice.rolledUp - perParent * 2) < 1e-9);
  assert.equal(spice.displayUnit, "oz");
  assert.deepEqual(spice.flags, []);
  assert.equal(formatReadableQuantity(spice.rolledUp, spice.displayUnit), "7.05 oz");
  const note = formatStockNote(spice.rolledUp, spice.displayUnit);
  assert.equal(note, "(≈ 7.05 oz of stock)");
  assert.equal(note.includes("28.349523125"), false);
});

test("milliliters on a fluid-ounce component total in fluid ounces", () => {
  const oil = resolveBomTreeQuantity(
    { quantity: 250, unit_of_measure: "mL" },
    { name: "QA TEST Fluid oil", unit_of_measure: "fl_oz" },
    1
  );
  const flOz = 250 / (3785.411784 / 128);
  assert.ok(Math.abs(oil.perParentStock - flOz) < 1e-9);
  assert.equal(oil.rolledUp, oil.perParentStock);
  assert.equal(oil.displayUnit, "fl_oz");
  assert.deepEqual(oil.flags, []);
  assert.equal(formatStockNote(oil.perParentStock, oil.displayUnit), "(≈ 8.45 fl oz of stock)");
  assert.equal(formatReadableQuantity(oil.rolledUp, oil.displayUnit), "1.06 cup");
});

test("a blocked parent does not display nested ingredients as zero", () => {
  const blend = resolveBomTreeQuantity(
    { quantity: 2, unit_of_measure: "oz" },
    { name: "Chili blend", unit_of_measure: "ea", make_or_buy: "make" },
    10
  );
  assert.equal(blend.childMultiplier, null);

  const flake = resolveBomTreeQuantity(
    { quantity: 3, unit_of_measure: "oz" },
    { name: "Chili flake", unit_of_measure: "oz" },
    blend.childMultiplier
  );
  const readout = bomTreeQuantityReadout(flake, blend.childMultiplier, true, 1);
  assert.equal(readout.primary, "3 oz");
  assert.equal(readout.label, "per parent");
  assert.equal(flake.flags[0].code, "parent_blocked");
});

test("a real parent quantity of zero still shows zero nested material", () => {
  const flake = resolveBomTreeQuantity(
    { quantity: 3, unit_of_measure: "oz" },
    { unit_of_measure: "oz" },
    0
  );
  const readout = bomTreeQuantityReadout(flake, 0, true, 1);
  assert.equal(flake.rolledUp, 0);
  assert.equal(readout.primary, "0 oz");
  assert.equal(readout.label, "for batch");
});

test("a convertible line still scales to the batch", () => {
  const dough = resolveBomTreeQuantity(
    { quantity: 1, unit_of_measure: "lb" },
    { unit_of_measure: "lb", make_or_buy: "make" },
    10
  );
  const readout = bomTreeQuantityReadout(dough, 10, true, 0);
  assert.equal(readout.primary, "10 lb");
  assert.equal(readout.label, "for batch");
  assert.deepEqual(readout.details, ["1 lb per item"]);
});

test("a pound still does not total as milliliters", () => {
  const line = resolveBomTreeQuantity(
    { quantity: 1, unit_of_measure: "lb" },
    { name: "QA TEST Oil", unit_of_measure: "mL" },
    1
  );
  assert.equal(line.perParentStock, null);
  assert.equal(line.rolledUp, null);
  assert.equal(line.flags[0].code, "unit_mismatch");
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
