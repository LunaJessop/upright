import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupByPhaseName, phaseChoices, phaseIdForPayload, UNSET_PHASE_LABEL } from "./recipePhase.js";

describe("recipe phase links", () => {
  it("sends a phase id or null", () => {
    assert.equal(phaseIdForPayload(""), null);
    assert.equal(phaseIdForPayload(null), null);
    assert.equal(phaseIdForPayload("4"), 4);
    assert.equal(phaseIdForPayload("0"), null);
  });

  it("stays a flat list when every phase name is missing", () => {
    const grouped = groupByPhaseName([
      { name: "Wax", phase_name: null },
      { name: "Oil", phase_name: "" },
    ]);
    assert.equal(grouped.grouped, false);
    assert.equal(grouped.groups.length, 1);
    assert.equal(grouped.groups[0].name, null);
    assert.equal(grouped.groups[0].rows.length, 2);
  });

  it("groups named phases and keeps unset lines together", () => {
    const grouped = groupByPhaseName([
      { name: "Wax", phase_name: "Pour" },
      { name: "Oil", phase_name: null },
      { name: "Color", phase_name: "Blend" },
      { name: "Jar", phase_name: "Pour" },
    ]);
    assert.equal(grouped.grouped, true);
    assert.deepEqual(
      grouped.groups.map((group) => group.name),
      ["Pour", "Blend", UNSET_PHASE_LABEL]
    );
    assert.deepEqual(
      grouped.groups[0].rows.map((row) => row.name),
      ["Wax", "Jar"]
    );
    assert.equal(grouped.groups[2].rows[0].name, "Oil");
  });

  it("lists company phases with the current line's phase if it is missing", () => {
    const options = phaseChoices(
      [
        { id: 2, name: "Pour" },
        { id: 1, name: "blend" },
      ],
      { phaseId: "9", phaseName: "Cure" }
    );
    assert.deepEqual(
      options.map((option) => option.label),
      ["blend", "Pour", "Cure"]
    );
  });
});
