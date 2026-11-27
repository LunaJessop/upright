import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { initialHelpState, placeHelpTooltip, reduceHelp } from "./helpTooltip.js";

function openBy(type) {
  return reduceHelp(initialHelpState, { type });
}

describe("reduceHelp", () => {
  it("shows the note on hover and hides it when the pointer leaves", () => {
    const hovering = openBy("hover-start");
    assert.equal(hovering.open, true);
    assert.equal(hovering.hover, true);
    const left = reduceHelp(hovering, { type: "hover-end" });
    assert.equal(left.open, false);
    assert.equal(left.hover, false);
  });

  it("shows the note while the control has keyboard focus", () => {
    const focused = openBy("focus");
    assert.equal(focused.open, true);
    assert.equal(focused.focus, true);
    const blurred = reduceHelp(focused, { type: "blur" });
    assert.equal(blurred.open, false);
    assert.equal(blurred.focus, false);
  });

  it("pins the note on tap and closes it on the next tap", () => {
    const pinned = openBy("tap");
    assert.equal(pinned.open, true);
    assert.equal(pinned.pinned, true);
    const closed = reduceHelp(pinned, { type: "tap" });
    assert.equal(closed.open, false);
    assert.equal(closed.pinned, false);
    assert.equal(closed.dismissed, true);
  });

  it("keeps a hovered note open after a tap, then lets Escape close it", () => {
    const hovering = openBy("hover-start");
    const pinned = reduceHelp(hovering, { type: "tap" });
    assert.equal(pinned.open, true);
    assert.equal(pinned.pinned, true);
    const left = reduceHelp(pinned, { type: "hover-end" });
    assert.equal(left.open, true);
    const dismissed = reduceHelp(left, { type: "escape" });
    assert.equal(dismissed.open, false);
    assert.equal(dismissed.pinned, false);
    assert.equal(dismissed.dismissed, true);
    const stillHovering = reduceHelp(dismissed, { type: "hover-start" });
    assert.equal(stillHovering.open, false);
  });

  it("lets Escape dismiss a focused note until focus leaves", () => {
    const focused = openBy("focus");
    const dismissed = reduceHelp(focused, { type: "escape" });
    assert.equal(dismissed.open, false);
    assert.equal(dismissed.focus, true);
    const refocused = reduceHelp(
      reduceHelp(dismissed, { type: "blur" }),
      { type: "focus" }
    );
    assert.equal(refocused.open, true);
  });

  it("closes a pinned note when the press is outside the control", () => {
    const pinned = openBy("tap");
    const outside = reduceHelp(pinned, { type: "outside" });
    assert.equal(outside.open, false);
    assert.equal(outside.pinned, false);
  });

  it("closes a focused note on an outside press and keeps it closed", () => {
    const focused = openBy("focus");
    const outside = reduceHelp(focused, { type: "outside" });
    assert.equal(outside.open, false);
    assert.equal(outside.dismissed, true);
    assert.equal(reduceHelp(outside, { type: "hover-start" }).open, false);
  });

  it("ignores unknown events", () => {
    assert.equal(reduceHelp(initialHelpState, { type: "nope" }), initialHelpState);
    assert.equal(reduceHelp(initialHelpState, null), initialHelpState);
  });
});

describe("placeHelpTooltip", () => {
  const tip = { width: 200, height: 40 };

  it("centers the note under the control", () => {
    const placed = placeHelpTooltip(
      { left: 100, top: 100, width: 16, height: 16, bottom: 116 },
      tip,
      { width: 800, height: 600 }
    );
    assert.equal(placed.left, 8);
    assert.equal(placed.top, 122);
  });

  it("stays inside the left and right edges", () => {
    const placed = placeHelpTooltip(
      { left: 0, top: 20, width: 16, height: 16, bottom: 36 },
      tip,
      { width: 320, height: 600 }
    );
    assert.equal(placed.left, 8);
    const right = placeHelpTooltip(
      { left: 300, top: 20, width: 16, height: 16, bottom: 36 },
      tip,
      { width: 320, height: 600 }
    );
    assert.equal(right.left, 112);
  });

  it("flips above the control when the bottom edge is too close", () => {
    const placed = placeHelpTooltip(
      { left: 100, top: 500, width: 16, height: 16, bottom: 516 },
      { width: 200, height: 80 },
      { width: 800, height: 540 }
    );
    assert.equal(placed.top, 414);
  });
});
