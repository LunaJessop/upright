import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BomRecipeEditor, { MultiSelectDropdown } from "./BomRecipeEditor.jsx";

const catalog = [
  { id: 21, name: "QA TEST Jojoba", sku: "QA-JOJ", unit_of_measure: "oz" },
  { id: 20, name: "QA TEST Face Oil", sku: "QA-OIL", unit_of_measure: "oz" },
];

const noop = () => {};

test("an open component dropdown stripes rows with the tone it receives", () => {
  const html = renderToStaticMarkup(
    createElement(MultiSelectDropdown, {
      title: "Components",
      options: catalog.map((item) => ({
        value: String(item.id),
        label: item.name,
      })),
      selectedValues: [],
      onChange: noop,
      tone: "violet",
      defaultOpen: true,
    })
  );

  assert.match(html, /QA TEST Jojoba/);
  assert.match(html, /bg-nv-violet\/15/);
  assert.doesNotMatch(html, /bg-nv-cyan\/15/);
});

test("the recipe editor opens its component list without a missing tone", () => {
  const html = renderToStaticMarkup(
    createElement(BomRecipeEditor, {
      catalogItems: catalog,
      bomLines: [],
      selectedItemIds: [],
      onSelectedItemIdsChange: noop,
      onAddSelected: noop,
      onRemoveLine: noop,
      onUpdateLineQuantity: noop,
      onUpdateLineUnit: noop,
      tone: "cyan",
      defaultOpen: true,
    })
  );

  assert.match(html, /QA TEST Jojoba/);
  assert.match(html, /bg-nv-cyan\/15/);
  assert.match(html, /Add/);
});
