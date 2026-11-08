import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyInclude,
  checklistComplete,
  setupStepHref,
  summarizeApply,
} from "./onboarding.js";

describe("shop setup", () => {
  it("links each checklist step to the page that does the work", () => {
    assert.equal(setupStepHref("phases"), "/settings/phases");
    assert.equal(setupStepHref("buy_items"), "/items");
    assert.equal(setupStepHref("vendors"), "/settings/vendors");
    assert.equal(setupStepHref("make_items"), "/items/new-item");
    assert.equal(setupStepHref("batches"), "/batches");
  });

  it("hides the checklist only when every step is done", () => {
    assert.equal(
      checklistComplete({
        checklist: [
          { key: "phases", done: true },
          { key: "batches", done: false },
        ],
      }),
      false
    );
    assert.equal(
      checklistComplete({
        checklist: [
          { key: "phases", done: true },
          { key: "batches", done: true },
        ],
      }),
      true
    );
    assert.equal(checklistComplete({ checklist: [] }), false);
  });

  it("sends phases and items only when those boxes are checked", () => {
    assert.deepEqual(applyInclude(true, false), { phases: true, items: false });
    assert.deepEqual(applyInclude(false, true), { phases: false, items: true });
  });

  it("separates what was added from what the shop already had", () => {
    const summary = summarizeApply({
      phases: { created: [{ name: "Melt oils" }], skipped: ["Pour"] },
      items: { created: [{ name: "Olive oil" }], skipped: ["Coconut oil"] },
    });
    assert.deepEqual(summary.createdPhases.map((row) => row.name), ["Melt oils"]);
    assert.deepEqual(summary.skippedPhases, ["Pour"]);
    assert.deepEqual(summary.createdItems.map((row) => row.name), ["Olive oil"]);
    assert.deepEqual(summary.skippedItems, ["Coconut oil"]);
  });
});
