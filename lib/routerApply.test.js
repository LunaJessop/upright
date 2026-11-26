import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  copyRouterPhases,
  displayStartedFromName,
  resolveStartedFromName,
  startItemFromRouter,
  withSourceRouter,
} from "./routerApply.js";

const coldProcess = {
  id: 4,
  name: " Cold process ",
  phases: [
    {
      id: 99,
      sequence: 3,
      name: "Melt",
      description: "Warm the oils",
      estimated_minutes: 15,
      phase_template_id: 7,
    },
    {
      id: 100,
      sequence: 4,
      name: "Pour",
      description: null,
      estimated_minutes: null,
      phase_template_id: null,
    },
  ],
};

const existingPhases = [
  { id: 1, sequence: 9, name: "Old", description: "keep", estimated_minutes: "5" },
];

const recipe = [
  { id: 2, itemId: "8", quantity: "4", unitOfMeasure: "oz", phaseId: "7", phaseName: "Melt" },
];

describe("copyRouterPhases", () => {
  it("copies phase text onto new item rows and keeps the library phase id", () => {
    assert.deepEqual(copyRouterPhases(coldProcess, 5), [
      {
        id: 5,
        sequence: 1,
        name: "Melt",
        description: "Warm the oils",
        estimated_minutes: "15",
        libraryPhaseId: "7",
      },
      {
        id: 6,
        sequence: 2,
        name: "Pour",
        description: "",
        estimated_minutes: "",
        libraryPhaseId: "",
      },
    ]);
  });

  it("does not reuse the saved router's own phase ids", () => {
    const copied = copyRouterPhases(coldProcess, 5);
    assert.equal(copied.some((phase) => phase.id === 99 || phase.id === 100), false);
  });
});

describe("startItemFromRouter", () => {
  it("replaces the item phases and leaves recipe quantities alone", () => {
    const result = startItemFromRouter({
      phases: existingPhases,
      bomLines: recipe,
      router: coldProcess,
      mode: "replace",
      startId: 5,
    });

    assert.equal(result.applied, true);
    assert.deepEqual(
      result.phases.map((phase) => phase.name),
      ["Melt", "Pour"]
    );
    assert.deepEqual(
      result.phases.map((phase) => phase.sequence),
      [1, 2]
    );
    assert.equal(result.phases[0].libraryPhaseId, "7");
    assert.equal(result.bomLines, recipe);
    assert.equal(recipe[0].quantity, "4");
    assert.equal(recipe[0].phaseId, "7");
    assert.equal(existingPhases[0].sequence, 9);
    assert.equal(result.sourceRouterId, 4);
    assert.equal(result.sourceRouterName, "Cold process");
    assert.equal(result.nextId, 7);
  });

  it("adds the router after the phases already on the item", () => {
    const result = startItemFromRouter({
      phases: existingPhases,
      bomLines: recipe,
      router: coldProcess,
      mode: "append",
      startId: 5,
    });

    assert.deepEqual(
      result.phases.map((phase) => [phase.sequence, phase.name]),
      [
        [1, "Old"],
        [2, "Melt"],
        [3, "Pour"],
      ]
    );
    assert.equal(result.phases[0].description, "keep");
    assert.notEqual(result.phases[0], existingPhases[0]);
    assert.equal(existingPhases[0].name, "Old");
    assert.equal(result.bomLines, recipe);
    assert.equal(result.sourceRouterId, 4);
  });

  it("leaves phases and recipe lines untouched when the choice is cancelled", () => {
    const cancelled = startItemFromRouter({
      phases: existingPhases,
      bomLines: recipe,
      router: coldProcess,
      mode: "cancel",
      startId: 5,
    });
    assert.equal(cancelled.applied, false);
    assert.equal(cancelled.phases, existingPhases);
    assert.equal(cancelled.bomLines, recipe);
    assert.equal(cancelled.sourceRouterId, null);
    assert.equal(cancelled.nextId, 5);

    const ignored = startItemFromRouter({
      phases: existingPhases,
      bomLines: recipe,
      router: coldProcess,
      mode: "overwrite",
      startId: 5,
    });
    assert.equal(ignored.applied, false);
    assert.equal(ignored.phases, existingPhases);
  });

  it("copies an empty router without inventing phases or touching the recipe", () => {
    const result = startItemFromRouter({
      phases: [],
      bomLines: recipe,
      router: { id: "8", name: "Blank", phases: [] },
      mode: "replace",
      startId: 3,
    });
    assert.deepEqual(result.phases, []);
    assert.equal(result.bomLines, recipe);
    assert.equal(result.sourceRouterId, 8);
    assert.equal(result.nextId, 3);
  });
});

describe("source router label", () => {
  it("adds the router id only when the item was started from one", () => {
    const payload = { name: "Soap", router_phases: [{ sequence: 1, name: "Melt" }] };
    assert.equal(withSourceRouter(payload, null), payload);
    assert.deepEqual(withSourceRouter(payload, "4"), {
      ...payload,
      source_router_id: 4,
    });
    assert.equal(payload.source_router_id, undefined);
  });

  it("uses the saved router's current name for the note", () => {
    const routers = [{ id: 4, name: "Cold process" }];
    assert.equal(resolveStartedFromName(4, routers), "Cold process");
    assert.equal(resolveStartedFromName(null, routers, "Earlier"), "Earlier");
    assert.equal(
      displayStartedFromName({
        choice: { id: 9, name: " Hot process " },
        savedId: 4,
        routers,
      }),
      "Hot process"
    );
    assert.equal(
      displayStartedFromName({ choice: null, savedId: 4, routers }),
      "Cold process"
    );
    assert.equal(
      displayStartedFromName({ choice: null, savedId: null, routers }),
      ""
    );
  });
});
