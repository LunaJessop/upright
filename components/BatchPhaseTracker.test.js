import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BatchPhaseTracker from "./BatchPhaseTracker.jsx";

const phases = [
  { id: 1, name: "Melt", status: "pending", source_item_id: 4, source_item_name: "Soap", source_item_qty: 2 },
  { id: 2, name: "Pour", status: "pending", source_item_id: 4, source_item_name: "Soap", source_item_qty: 2 },
];

const components = [
  {
    id: 11,
    name: "Olive oil",
    phase_id: 7,
    phase_name: "Melt",
    quantity_allocated: 12,
    unit_of_measure: "fl_oz",
  },
  {
    id: 12,
    name: "Lye",
    phase_id: null,
    phase_name: null,
    quantity_allocated: 2,
    unit_of_measure: "oz",
  },
];

test("a phase lists its ingredients beside play and complete", () => {
  const html = renderToStaticMarkup(
    createElement(BatchPhaseTracker, {
      phases,
      components,
      updating: false,
      onStatusChange() {},
    })
  );
  const melt = html.slice(html.indexOf(">Melt<"), html.indexOf(">Pour<"));
  assert.match(melt, /<ul[^>]*aria-label="Ingredients for Melt"/);
  assert.match(melt, /<li[^>]*>Olive oil<span[^>]*> — 12 fl oz<\/span><\/li>/);
  assert.doesNotMatch(melt, /Lye/);
  assert.match(melt, /aria-label="Start"/);
  assert.match(melt, /aria-label="Complete"/);
  assert.match(html, /aria-label="Ingredients not on one step"/);
  assert.match(html, /Lye/);
  assert.match(html, /Not assigned to a phase/);
  assert.doesNotMatch(html, /bg-nv-purple-muted/);
});

test("play and complete stay available when a step has no ingredients", () => {
  const html = renderToStaticMarkup(
    createElement(BatchPhaseTracker, {
      phases: [{ id: 3, name: "Label", status: "in_progress", source_item_id: 4, source_item_name: "Soap" }],
      components: [],
      updating: false,
      onStatusChange() {},
    })
  );
  assert.match(html, /No ingredients for this step/);
  assert.match(html, /aria-label="Stop \/ reset"/);
  assert.match(html, /aria-label="Complete"/);
  assert.doesNotMatch(html, /Ingredients not on one step/);
});
