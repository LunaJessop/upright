import assert from "node:assert/strict";
import test from "node:test";
import { buildBatchReceipt } from "./batchReceipt.js";

const shea = {
  id: 1,
  name: "Shea butter",
  make_or_buy: "buy",
  quantity_allocated: 32,
  unit_of_measure: "oz",
  unit_cost_snapshot: 0.28125,
  line_cost: 9,
};

const jojoba = {
  id: 2,
  name: "Jojoba oil",
  make_or_buy: "buy",
  quantity_allocated: 16,
  unit_of_measure: "fl_oz",
  unit_cost_snapshot: 0.8,
  line_cost: 12.8,
};

const nestedMake = {
  id: 3,
  name: "Face oil",
  make_or_buy: "make",
  quantity_allocated: 24,
  unit_of_measure: "oz",
  unit_cost_snapshot: 3,
  line_cost: 72,
};

test("receipt totals use exact ingredient costs and everyday units", () => {
  const receipt = buildBatchReceipt({
    components: [shea, jojoba, nestedMake],
    quantity: 24,
    unitSell: 8,
  });

  assert.equal(receipt.materialLines.length, 2);
  assert.equal(receipt.materialLines[0].title, "Shea butter");
  assert.equal(receipt.materialLines[0].detail, "2 lb × $4.50/lb");
  assert.equal(receipt.materialLines[0].amount, "$9.00");
  assert.equal(receipt.materialLines[1].detail, "1 pt × $12.80/pt");
  assert.equal(receipt.materialLines[1].amount, "$12.80");

  assert.equal(receipt.materialTotal, 21.8);
  assert.equal(receipt.materialCost.detail, "$0.91/unit × 24 units");
  assert.equal(receipt.materialCost.amount, "$21.80");
  assert.notEqual(
    receipt.materialCost.amount,
    "$21.84"
  );

  assert.equal(receipt.sellLine.detail, "$8.00/unit × 24 units");
  assert.equal(receipt.sellLine.amount, "$192.00");
  assert.equal(receipt.materialDeduction.amount, "−$21.80");
  assert.equal(receipt.profit.amount, "$170.20");
  assert.equal(receipt.margin.detail, "$170.20 ÷ $192.00");
  assert.equal(receipt.margin.amount, "88.6%");
  assert.equal(receipt.revenueMessage, null);
});

test("per-unit display can differ by a cent from the line total", () => {
  const receipt = buildBatchReceipt({
    components: [
      {
        id: 9,
        name: "Wax",
        make_or_buy: "buy",
        quantity_allocated: 2,
        unit_of_measure: "lb",
        unit_cost_snapshot: 4.5,
        line_cost: 9.004,
      },
    ],
    quantity: 1,
    unitSell: 8,
  });

  assert.equal(receipt.materialLines[0].detail, "2 lb × $4.50/lb");
  assert.equal(receipt.materialLines[0].amount, "$9.00");
  assert.equal(receipt.materialCost.amount, "$9.00");
  assert.equal(receipt.profit.amount, "-$1.00");
});

test("missing sell price skips revenue math", () => {
  const receipt = buildBatchReceipt({
    components: [shea],
    quantity: 4,
    unitSell: null,
  });
  assert.equal(receipt.revenueMessage, "Set a sell price to see revenue");
  assert.equal(receipt.sellLine, null);
  assert.equal(receipt.profit, null);
  assert.equal(receipt.margin, null);
  assert.equal(receipt.materialCost.detail, "$2.25/unit × 4 units");
});

test("zero units does not divide", () => {
  const receipt = buildBatchReceipt({
    components: [jojoba],
    quantity: 0,
    unitSell: 8,
  });
  assert.equal(receipt.zeroUnits, true);
  assert.equal(receipt.materialCost.detail, "No units on this batch");
  assert.equal(receipt.materialCost.amount, "$12.80");
  assert.equal(receipt.revenueMessage, "No units on this batch");
  assert.equal(receipt.profit, null);
});

test("batches without ingredient lines keep the recorded material cost", () => {
  const receipt = buildBatchReceipt({
    components: [],
    quantity: 4,
    unitSell: 8,
    projectedCost: 10,
  });
  assert.equal(receipt.materialLines.length, 0);
  assert.equal(receipt.materialCost.amount, "$10.00");
  assert.equal(receipt.materialCost.detail, "$2.50/unit × 4 units");
  assert.equal(receipt.profit.amount, "$22.00");
});

test("ingredient lines win over a stored material total", () => {
  const receipt = buildBatchReceipt({
    components: [shea],
    quantity: 1,
    unitSell: 10,
    projectedCost: 99,
  });
  assert.equal(receipt.materialCost.amount, "$9.00");
});

test("a zero sell price has no margin", () => {
  const receipt = buildBatchReceipt({
    components: [shea],
    quantity: 2,
    unitSell: 0,
  });
  assert.equal(receipt.sellLine.amount, "$0.00");
  assert.equal(receipt.margin.amount, "—");
  assert.equal(receipt.margin.detail, "No revenue to measure margin");
});
