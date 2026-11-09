import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HeldAssignments, PhaseIngredients } from "./PhaseIngredients.jsx";

const catalog = [
  { id: 8, name: "Olive oil", sku: "OIL" },
  { id: 9, name: "Lye" },
];

test("a phase lists its ingredient and offers add", () => {
  const html = renderToStaticMarkup(
    createElement(PhaseIngredients, {
      phase: { id: "row-1", name: "Melt", libraryPhaseId: "7" },
      lines: [{ id: 1, itemId: "8", phaseId: "7", phaseName: "Melt" }],
      choices: [{ id: 2, itemId: "9", phaseId: "", phaseName: "" }],
      catalogItems: catalog,
      editable: true,
      open: true,
      onToggle() {},
      onSetLinePhase() {},
    })
  );
  assert.match(html, /Ingredients on Melt/);
  assert.match(html, /Olive oil \(OIL\)/);
  assert.match(html, />Unassign</);
  assert.match(html, />Add</);
  assert.doesNotMatch(html, /Used in phase/);
});

test("an ingredient already on another phase asks before it moves", () => {
  const html = renderToStaticMarkup(
    createElement(PhaseIngredients, {
      phase: { id: "pour", name: "Pour", libraryPhaseId: "8" },
      lines: [],
      choices: [{ id: 2, itemId: "9", phaseId: "7", phaseName: "Melt" }],
      catalogItems: catalog,
      editable: true,
      open: true,
      onToggle() {},
      onSetLinePhase() {},
    })
  );
  assert.match(html, /On Melt/);
  assert.match(html, />Move here</);
});

test("an assignment that is not on one step stays visible", () => {
  const html = renderToStaticMarkup(
    createElement(HeldAssignments, {
      held: [
        {
          line: { id: 1, itemId: "8", phaseId: "7", phaseName: "Melt" },
          reason: "ambiguous",
          phaseName: "Melt",
        },
      ],
      targets: [],
      catalogItems: catalog,
      onSetLinePhase() {},
    })
  );
  assert.match(html, /Ingredients still assigned/);
  assert.match(html, /more than one step/);
  assert.match(html, />Unassign</);
});
