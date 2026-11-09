import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ingredientChoice,
  phaseIngredientPlan,
  resolveRouterLibraryIds,
  setLinePhase,
} from "./phaseAssignment.js";

const templates = [
  { id: 7, name: "Melt" },
  { id: 8, name: "Pour" },
];

describe("phase assignment", () => {
  it("recognizes a library phase from a unique name and keeps an explicit id", () => {
    const resolved = resolveRouterLibraryIds(
      [
        { id: "row-1", name: "Melt" },
        { id: "row-2", name: "  ", libraryPhaseId: 8 },
        { id: "row-3", name: "Cure" },
        { id: "row-4", name: "Cure" },
      ],
      templates
    );
    assert.equal(resolved[0].libraryPhaseId, "7");
    assert.equal(resolved[1].libraryPhaseId, "8");
    assert.equal(resolved[2].libraryPhaseId, "");
    assert.equal(resolved[3].libraryPhaseId, "");
  });

  it("shows a saved ingredient on the one matching step and does not use the row id", () => {
    const plan = phaseIngredientPlan(
      [{ id: "row-1", name: "Melt" }],
      [{ id: 1, itemId: "8", phaseId: "7", phaseName: "Melt" }],
      templates
    );
    assert.equal(plan.assigned.get("row-1")[0].itemId, "8");
    assert.equal(plan.held.length, 0);
    assert.equal(plan.editable.get("row-1"), true);
    assert.notEqual(plan.resolved[0].libraryPhaseId, "row-1");
  });

  it("keeps an assignment that is not on a single step without clearing it", () => {
    const lines = [
      { id: 1, itemId: "8", phaseId: "7", phaseName: "Melt" },
      { id: 2, itemId: "9", phaseId: "8", phaseName: "Pour" },
    ];
    const phases = [
      { id: "a", name: "Melt", libraryPhaseId: "7" },
      { id: "b", name: "Melt", libraryPhaseId: "7" },
    ];
    const plan = phaseIngredientPlan(phases, lines, templates);
    assert.equal(plan.assigned.get("a").length, 0);
    assert.equal(plan.assigned.get("b").length, 0);
    assert.equal(plan.held[0].reason, "ambiguous");
    assert.equal(plan.held[1].line.itemId, "9");
    assert.equal(plan.held[1].reason, "missing");
    const removed = phases.filter((phase) => phase.id !== "a");
    const afterRemoval = phaseIngredientPlan(removed, lines, templates);
    assert.equal(afterRemoval.assigned.get("b")[0].itemId, "8");
    assert.deepEqual(lines.map((line) => line.phaseId), ["7", "8"]);
  });

  it("adds, moves, and unassigns only when asked", () => {
    const lines = [
      { id: 1, phaseId: "", phaseName: "" },
      { id: 2, phaseId: "7", phaseName: "Melt" },
    ];
    assert.deepEqual(ingredientChoice(lines[0], "8"), { action: "add", phaseName: "" });
    assert.deepEqual(ingredientChoice(lines[1], "8"), { action: "move", phaseName: "Melt" });
    assert.equal(ingredientChoice(lines[1], "7").action, "here");
    const added = setLinePhase(lines, 1, "8", "Pour");
    assert.equal(added[0].phaseId, "8");
    assert.equal(added[1].phaseId, "7");
    const moved = setLinePhase(added, 2, "8", "Pour");
    assert.equal(moved[1].phaseId, "8");
    const cleared = setLinePhase(moved, 2, "", "");
    assert.equal(cleared[1].phaseId, "");
    assert.equal(cleared[1].phaseName, "");
  });
});
