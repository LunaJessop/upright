import assert from "node:assert/strict";
import test from "node:test";
import {
  formatQuantity,
  formatQuantityAmount,
  formatReadableQuantity,
  formatStockNote,
  friendlyUnitLabel,
  readableQuantity,
} from "./formatQuantity.js";

test("friendly labels replace canonical codes", () => {
  assert.equal(friendlyUnitLabel("fl_oz"), "fl oz");
  assert.equal(friendlyUnitLabel("ea"), "each");
  assert.equal(friendlyUnitLabel("sq_ft"), "sq ft");
  assert.equal(friendlyUnitLabel("short_ton"), "short ton");
  assert.equal(formatQuantity(1, "fl_oz"), "1 fl oz");
  assert.equal(formatQuantity(2, "sq_ft"), "2 sq ft");
  assert.equal(formatQuantity(4, "ea"), "4 each");
});

test("rounds to about 2 decimals and trims trailing zeros", () => {
  assert.equal(formatQuantityAmount(1.5), "1.5");
  assert.equal(formatQuantityAmount(1.5), "1.5");
  assert.equal(formatQuantityAmount(1.25), "1.25");
  assert.equal(formatQuantityAmount(1), "1");
  assert.equal(formatQuantity(1.5, "L"), "1.5 L");
  assert.equal(formatQuantity(2, "lb"), "2 lb");
});

test("small stock equivalents keep enough decimals to stay readable", () => {
  assert.equal(formatQuantity(1 / 128, "gal"), "0.0078 gal");
  assert.equal(formatStockNote(1 / 128, "gal"), "(≈ 0.0078 gal of stock)");
});

test("128 fl oz displays as 1 gal", () => {
  assert.equal(formatReadableQuantity(128, "fl_oz"), "1 gal");
  assert.equal(readableQuantity(128, "fl_oz").unit, "gal");
});

test("40 fl oz uses the largest unit that stays at or above 1", () => {
  const chosen = readableQuantity(40, "fl_oz");
  assert.equal(chosen.unit, "qt");
  assert.equal(formatReadableQuantity(40, "fl_oz"), "1.25 qt");
  assert.equal(formatQuantity(2.5, "pt"), "2.5 pt");
});

test("1500 mL displays as 1.5 L", () => {
  assert.equal(formatReadableQuantity(1500, "mL"), "1.5 L");
});

test("grams scale up to kilograms and stay metric", () => {
  assert.equal(formatReadableQuantity(1500, "g"), "1.5 kg");
  assert.equal(formatReadableQuantity(999, "g"), "999 g");
  assert.equal(readableQuantity(1500, "g").unit, "kg");
});

test("each is never rescaled", () => {
  assert.equal(formatReadableQuantity(40, "ea"), "40 each");
  assert.equal(formatReadableQuantity(0.5, "ea"), "0.5 each");
  assert.equal(readableQuantity(1000, "ea").unit, "ea");
});

test("US and metric length stay in the system of the entered unit", () => {
  assert.equal(formatReadableQuantity(1500, "mm"), "1.5 m");
  assert.equal(formatReadableQuantity(3, "ft"), "1 yd");
  assert.notEqual(readableQuantity(1500, "mm").unit, "ft");
  assert.notEqual(readableQuantity(3, "ft").unit, "m");
});

test("unknown or missing units pass through and do not throw", () => {
  assert.equal(formatQuantity(3, "bushel"), "3 bushel");
  assert.equal(formatReadableQuantity(3.5, "bushel"), "3.5 bushel");
  assert.equal(formatQuantity(4, ""), "4");
  assert.equal(formatReadableQuantity(4, null), "4");
  assert.equal(formatQuantity("lots", "fl_oz"), "lots fl oz");
  assert.equal(formatStockNote(null, "gal"), "");
  assert.doesNotThrow(() => formatReadableQuantity(undefined, undefined));
  assert.doesNotThrow(() => formatQuantity({}, "nope"));
});
