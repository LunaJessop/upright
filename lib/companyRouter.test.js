import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  companyRouterPayload,
  moveDraftPhase,
  phaseDraftFromName,
  phaseDraftFromTemplate,
  removeDraftPhase,
  routerPhaseSummary,
  routerToForm,
} from "./companyRouter.js";

const library = [
  { id: 7, name: "Melt", description: "Warm the oils", estimated_minutes: 15 },
  { id: 8, name: "Pour", description: null, estimated_minutes: null },
];

describe("router drafts", () => {
  it("copies a library phase, including its template id", () => {
    assert.deepEqual(phaseDraftFromTemplate(library[0], "phase-1"), {
      key: "phase-1",
      name: "Melt",
      description: "Warm the oils",
      estimated_minutes: 15,
      phase_template_id: 7,
    });
  });

  it("uses the library when a typed name matches, and a plain name otherwise", () => {
    assert.equal(phaseDraftFromName("  ", library, "phase-1"), null);
    assert.equal(phaseDraftFromName(" Melt ", library, "phase-1").phase_template_id, 7);
    assert.deepEqual(phaseDraftFromName("Cure", library, "phase-2"), {
      key: "phase-2",
      name: "Cure",
      description: "",
      estimated_minutes: "",
      phase_template_id: null,
    });
  });

  it("loads a saved router into the editor", () => {
    assert.deepEqual(
      routerToForm({
        name: "Cold process",
        description: null,
        phases: [
          {
            id: 3,
            name: "Melt",
            description: null,
            estimated_minutes: 15,
            phase_template_id: 7,
          },
        ],
      }),
      {
        name: "Cold process",
        description: "",
        phases: [
          {
            key: "saved-3",
            name: "Melt",
            description: "",
            estimated_minutes: 15,
            phase_template_id: 7,
          },
        ],
      }
    );
  });

  it("reorders and removes draft phases without changing the original list", () => {
    const phases = [
      { key: "a", name: "Melt" },
      { key: "b", name: "Pour" },
      { key: "c", name: "Cure" },
    ];
    assert.deepEqual(
      moveDraftPhase(phases, 2, "up").map((phase) => phase.name),
      ["Melt", "Cure", "Pour"]
    );
    assert.equal(moveDraftPhase(phases, 0, "up"), phases);
    assert.deepEqual(
      removeDraftPhase(phases, "b").map((phase) => phase.name),
      ["Melt", "Cure"]
    );
    assert.deepEqual(
      phases.map((phase) => phase.name),
      ["Melt", "Pour", "Cure"]
    );
  });

  it("summarizes the saved order", () => {
    assert.equal(routerPhaseSummary([]), "No phases yet");
    assert.equal(
      routerPhaseSummary([{ name: "Melt" }, { name: "" }, { name: "Cure" }]),
      "1. Melt → 2. Untitled → 3. Cure"
    );
  });
});

describe("companyRouterPayload", () => {
  it("numbers phases in their current order and omits a template id for a new name", () => {
    const result = companyRouterPayload({
      name: " Cold process ",
      description: "  ",
      phases: [
        phaseDraftFromTemplate(library[1], "b"),
        phaseDraftFromName("Cure", library, "c"),
      ],
    });
    assert.deepEqual(result.value, {
      name: "Cold process",
      description: null,
      phases: [
        {
          sequence: 1,
          name: "Pour",
          description: null,
          estimated_minutes: null,
          phase_template_id: 8,
        },
        {
          sequence: 2,
          name: "Cure",
          description: null,
          estimated_minutes: null,
        },
      ],
    });
  });

  it("requires a router name and a name on every phase", () => {
    assert.equal(companyRouterPayload({ name: "  ", phases: [] }).error, "Router name is required.");
    assert.equal(
      companyRouterPayload({
        name: "Cold process",
        phases: [{ name: "  ", estimated_minutes: "" }],
      }).error,
      "Phase 1 needs a name."
    );
  });
});
