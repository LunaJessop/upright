import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BatchDataList } from "./BatchDataFields.jsx";

const fields = [
  { label: "Item", value: "Soap" },
  { label: "Item link", value: "View item" },
  { label: "SKU", value: "ABC" },
  { label: "Quantity", value: "2" },
  { label: "Status", value: "pending" },
  { label: "Started", value: "—" },
  { label: "Completed", value: "—" },
  { label: "Created", value: "Nov 1, 2026" },
];

test("batch data is one column on a phone and two columns on a wide screen", () => {
  const html = renderToStaticMarkup(
    createElement(BatchDataList, { fields })
  );

  assert.match(html, /class="[^"]*grid-cols-1[^"]*lg:grid-cols-2/);
  assert.doesNotMatch(html, /sm:grid-cols-2/);
  assert.doesNotMatch(html, /md:grid-cols-2/);

  const item = html.indexOf(">Item<");
  const link = html.indexOf(">Item link<");
  const sku = html.indexOf(">SKU<");
  const quantity = html.indexOf(">Quantity<");
  const status = html.indexOf(">Status<");
  assert.ok(item < link && link < sku && sku < quantity && quantity < status);

  assert.match(html, /justify-between/);
  assert.match(html, /text-right/);
  assert.match(html, />Soap</);
  assert.match(html, />View item</);
  assert.match(html, /last:border-b-0/);
  assert.match(
    html,
    /lg:\[&amp;:nth-child\(odd\):nth-last-child\(2\)\]:border-b-0/
  );
});
