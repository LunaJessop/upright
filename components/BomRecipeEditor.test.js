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
  assert.match(html, /Type to filter/);
  assert.ok(html.indexOf("QA TEST Face Oil") < html.indexOf("QA TEST Jojoba"));
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
  assert.ok(html.indexOf("QA TEST Face Oil") < html.indexOf("QA TEST Jojoba"));
  assert.match(html, /bg-nv-cyan\/15/);
  assert.match(html, /Add/);
});

test("a recipe row keeps quantity editing and does not pick a phase", () => {
  const html = renderToStaticMarkup(
    createElement(BomRecipeEditor, {
      catalogItems: catalog,
      bomLines: [
        { id: 1, itemId: "21", quantity: "2", unitOfMeasure: "oz", phaseId: "2", phaseName: "Pour" },
      ],
      selectedItemIds: [],
      onSelectedItemIdsChange: noop,
      onAddSelected: noop,
      onRemoveLine: noop,
      onUpdateLineQuantity: noop,
      onUpdateLineUnit: noop,
      tone: "cyan",
    })
  );

  assert.match(html, /QA TEST Jojoba/);
  assert.match(html, /aria-label="BOM unit of measure"/);
  assert.doesNotMatch(html, /Used in phase/);
});
