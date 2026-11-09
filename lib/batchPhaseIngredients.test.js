import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  associateBatchPhaseIngredients,
  unassignedIngredientNote,
} from "./batchPhaseIngredients.js";

const phases = [
  { id: 1, name: "Melt", source_phase_id: 90, source_item_id: 4 },
  { id: 2, name: "Pour", source_phase_id: 91, source_item_id: 4 },
  { id: 3, name: "Pour", source_phase_id: 140, source_item_id: 8 },
];

describe("batch phase ingredients", () => {
  it("lists an ingredient only on the one step with its phase name", () => {
    const { byPhaseId, unassigned } = associateBatchPhaseIngredients(
      [{ id: 1, name: "Melt", source_phase_id: 90 }],
      [
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
      ]
    );
    assert.deepEqual(
      byPhaseId.get(1).map((line) => [line.name, line.quantity, line.batchPhaseId, line.entered]),
      [["Olive oil", "12 fl oz", 1, "0"]]
    );
    assert.notEqual(byPhaseId.get(1)[0].batchPhaseId, 90);
    assert.equal(unassigned.length, 1);
    assert.equal(unassigned[0].name, "Lye");
    assert.equal(unassigned[0].reason, "unset");
    assert.equal(unassigned[0].batchPhaseId, null);
    assert.equal(unassignedIngredientNote(unassigned[0]), "Not assigned to a phase.");
  });

  it("does not copy an ingredient onto every step that shares a name", () => {
    const { byPhaseId, unassigned } = associateBatchPhaseIngredients(phases, [
      {
        id: 21,
        name: "Fragrance",
        phase_id: 3,
        phase_name: "Pour",
        quantity_allocated: 1,
        unit_of_measure: "oz",
      },
    ]);
    assert.equal(byPhaseId.get(2).length, 0);
    assert.equal(byPhaseId.get(3).length, 0);
    assert.equal(unassigned.length, 1);
    assert.equal(unassigned[0].reason, "ambiguous");
    assert.equal(unassigned[0].batchPhaseId, null);
    assert.match(unassignedIngredientNote(unassigned[0]), /more than one step/);
  });

  it("keeps a named ingredient off the steps when that step is not on the batch", () => {
    const { byPhaseId, unassigned } = associateBatchPhaseIngredients(phases, [
      {
        id: 31,
        name: "Color",
        phase_id: 5,
        phase_name: "Cure",
        quantity_allocated: 0.5,
        unit_of_measure: "oz",
      },
    ]);
    assert.equal([...byPhaseId.values()].every((lines) => lines.length === 0), true);
    assert.equal(unassigned[0].reason, "missing");
    assert.match(unassignedIngredientNote(unassigned[0]), /not a step/);
  });

  it("uses the batch amount and does not treat the router id as the library phase", () => {
    const { byPhaseId } = associateBatchPhaseIngredients(
      [{ id: 1, name: "Melt", source_phase_id: 7 }],
      [
        {
          id: 41,
          name: "Olive oil",
          phase_id: 7,
          phase_name: "Blend",
          quantity_allocated: 4,
          unit_of_measure: "oz",
        },
      ]
    );
    assert.equal(byPhaseId.get(1).length, 0);
  });

  it("reads saved progress for the batch step id and leaves another step at zero", () => {
    const { byPhaseId, unassigned } = associateBatchPhaseIngredients(
      [{ id: 15, name: "Melt", source_phase_id: 90 }],
      [
        {
          id: 8,
          name: "Olive oil",
          phase_id: 7,
          phase_name: "Melt",
          quantity_allocated: "4",
          unit_of_measure: "oz",
          progress: [
            { batch_phase_id: 15, quantity_entered: "1.5" },
            { batch_phase_id: null, quantity_entered: "0" },
          ],
        },
        {
          id: 9,
          name: "Lye",
          phase_id: null,
          phase_name: null,
          quantity_allocated: "2",
          unit_of_measure: "oz",
          progress: [{ batch_phase_id: null, quantity_entered: "0.25" }],
        },
      ]
    );
    assert.equal(byPhaseId.get(15)[0].batchPhaseId, 15);
    assert.equal(byPhaseId.get(15)[0].entered, "1.5");
    assert.equal(unassigned[0].batchPhaseId, null);
    assert.equal(unassigned[0].entered, "0.25");
  });
});
