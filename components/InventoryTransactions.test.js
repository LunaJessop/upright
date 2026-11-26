import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  InventoryCardActions,
  InventoryTransactionForm,
  InventoryTransactionList,
} from "../app/items/[id]/components/InventoryTransactions.jsx";

const draft = {
  direction: "out",
  reason: "sold",
  quantity: "3",
  unitPrice: "",
  occurredOn: "2026-11-26",
  note: "",
};

test("the inventory card offers Transaction beside Edit, and hides both when writing is off", () => {
  const writable = renderToStaticMarkup(
    createElement(InventoryCardActions, {
      canWrite: true,
      inventoryEditing: false,
      inventoryReady: true,
      onEdit() {},
      onTransaction() {},
    })
  );
  assert.match(writable, />Transaction</);
  assert.match(writable, />Edit</);

  const readOnly = renderToStaticMarkup(
    createElement(InventoryCardActions, {
      canWrite: false,
      inventoryEditing: false,
      inventoryReady: true,
    })
  );
  assert.equal(readOnly.includes("Transaction"), false);
  assert.equal(readOnly.includes("Edit"), false);

  const editing = renderToStaticMarkup(
    createElement(InventoryCardActions, {
      canWrite: true,
      inventoryEditing: true,
      confirmingInventoryQty: false,
      inventoryReady: true,
    })
  );
  assert.match(editing, />Cancel</);
  assert.match(editing, />Save</);
  assert.equal(editing.includes("Transaction"), false);
});

test("the stock form shows the unit, the reasons for that direction, and the stock that would remain", () => {
  const html = renderToStaticMarkup(
    createElement(InventoryTransactionForm, {
      unit: "oz",
      draft,
      onChange() {},
      onHandAfter: "On hand after: 7 oz",
      message: "",
      onCancel() {},
      onSave() {},
    })
  );
  assert.match(html, /Quantity \(oz\)/);
  assert.match(html, /aria-pressed="true"[^>]*>Out</);
  assert.match(html, />Input</);
  assert.match(html, /<option[^>]*>Sell<\/option>/);
  assert.match(html, /<option[^>]*>Damaged<\/option>/);
  assert.doesNotMatch(html, /<option[^>]*>Return<\/option>/);
  assert.match(html, /Price per unit/);
  assert.match(html, /On hand after: 7 oz/);
  assert.match(html, />Cancel</);
});

test("an out that passes on-hand shows the block in the form", () => {
  const html = renderToStaticMarkup(
    createElement(InventoryTransactionForm, {
      unit: "oz",
      draft: { ...draft, quantity: "12" },
      onChange() {},
      onHandAfter: "On hand after: −2 oz",
      message: "That would take stock below zero.",
      saveDisabled: true,
      onCancel() {},
      onSave() {},
    })
  );
  assert.match(html, /That would take stock below zero\./);
  assert.match(html, /On hand after: −2 oz/);
  assert.match(html, /disabled=""/);
});

test("history stays in a fixed-height list, newest row first, with load more", () => {
  const html = renderToStaticMarkup(
    createElement(InventoryTransactionList, {
      transactions: [
        {
          id: 4,
          occurred_on: "2026-11-26",
          quantity_change: -2,
          quantity: 2,
          direction: "out",
          reason: "sold",
          unit_price: 4.5,
          unit_of_measure: "oz",
          note: "Saturday market stall",
          created_by_name: "Ada",
        },
      ],
      hasMore: true,
      onLoadMore() {},
    })
  );
  assert.match(html, /max-h-40/);
  assert.match(html, /overflow-y-auto/);
  assert.match(html, /Nov 26, 2026/);
  assert.match(html, /−2 oz/);
  assert.match(html, /Sell/);
  assert.match(html, /\$4\.50/);
  assert.match(html, /Saturday market stall/);
  assert.match(html, /title="Saturday market stall"/);
  assert.match(html, /Ada/);
  assert.match(html, />Load more</);
});

test("an item with no stock changes yet says history starts from today", () => {
  const html = renderToStaticMarkup(
    createElement(InventoryTransactionList, { transactions: [] })
  );
  assert.match(html, /History starts from today\./);
  assert.equal(html.includes("Load more"), false);
});
