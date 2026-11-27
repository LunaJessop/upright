import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FOCUSABLE_SELECTOR,
  PHASE_EDITOR_ID,
  PHASE_FIELD_SELECTOR,
  PHASE_HIGHLIGHT_MS,
  isPhaseEditorKey,
  phaseEditAction,
  phaseEditorKey,
  phaseKeyFromSearch,
  phaseRowSelector,
  prefersReducedMotion,
  revealPhaseEditor,
  scrollBehaviorForMotion,
} from "./phaseEditorFocus.js";

function createElement(tag, props = {}) {
  const el = {
    tag,
    id: props.id || "",
    phaseKey: props.phaseKey || "",
    phaseField: Boolean(props.phaseField),
    disabled: Boolean(props.disabled),
    type: props.type || "",
    href: props.href || "",
    tabIndex: props.tabIndex,
    children: [],
    scrolled: null,
    focused: null,
    append(child) {
      this.children.push(child);
      return child;
    },
    scrollIntoView(options) {
      this.scrolled = options;
    },
    focus(options) {
      this.focused = options;
    },
    querySelector(selector) {
      return query(this, selector);
    },
  };
  return el;
}

function matchesFocusable(el, selector) {
  if (selector === PHASE_FIELD_SELECTOR) return el.phaseField && !el.disabled;
  if (selector !== FOCUSABLE_SELECTOR) return false;
  if (el.tag === "a") return Boolean(el.href);
  if (el.tag === "button") return !el.disabled;
  if (el.tag === "input") return el.type !== "hidden" && !el.disabled;
  if (el.tag === "select" || el.tag === "textarea") return !el.disabled;
  return false;
}

function query(el, selector) {
  for (const child of el.children) {
    const rowSelector = child.phaseKey ? phaseRowSelector(child.phaseKey) : "";
    if (rowSelector && selector === rowSelector) return child;
    if (matchesFocusable(child, selector)) return child;
    const nested = query(child, selector);
    if (nested) return nested;
  }
  return null;
}

function createDocument(root) {
  return {
    getElementById(id) {
      return root.id === id ? root : null;
    },
  };
}

function editorTree() {
  const root = createElement("div", { id: PHASE_EDITOR_ID });
  root.append(createElement("input", { type: "hidden" }));
  root.append(createElement("select"));
  const phase = root.append(
    createElement("li", { phaseKey: "item-4-index-1", tabIndex: -1 })
  );
  phase.append(createElement("button", { disabled: true }));
  phase.append(createElement("button"));
  phase.append(createElement("button", { phaseField: true }));
  return root;
}

describe("phaseEditorKey", () => {
  it("builds a safe key and rejects ids that cannot sit in a selector", () => {
    assert.equal(phaseEditorKey(4, 1), "item-4-index-1");
    assert.equal(phaseEditorKey("sku_9", 0), "item-sku_9-index-0");
    assert.equal(isPhaseEditorKey(phaseEditorKey(4, 1)), true);
    assert.equal(phaseEditorKey("", 0), "");
    assert.equal(phaseEditorKey(null, 0), "");
    assert.equal(phaseEditorKey("a b", 0), "");
    assert.equal(phaseEditorKey(4, -1), "");
    assert.equal(phaseEditorKey(4, 1.5), "");
    assert.equal(phaseRowSelector('item-4-index-1"]'), "");
    assert.equal(phaseKeyFromSearch("?phase=item-4-index-1&edit=1"), "item-4-index-1");
    assert.equal(phaseKeyFromSearch("?phase=%22%3E"), "");
  });
});

describe("phaseEditAction", () => {
  it("focuses this item's editor and links out for a make child", () => {
    assert.deepEqual(phaseEditAction(4, "4", 1), {
      kind: "focus",
      focusId: PHASE_EDITOR_ID,
      phaseKey: "item-4-index-1",
    });
    assert.deepEqual(phaseEditAction(4, 9, 0), {
      kind: "navigate",
      focusId: PHASE_EDITOR_ID,
      phaseKey: "item-9-index-0",
      href: "/items/9?edit=1&phase=item-9-index-0#edit-phases",
    });
    assert.equal(phaseEditAction(4, "bad id", 0), null);
  });
});

describe("revealPhaseEditor", () => {
  it("smoothly scrolls to the clicked phase and focuses its first enabled field", () => {
    const root = editorTree();
    const phase = root.children[2];
    const result = revealPhaseEditor(createDocument(root), {
      phaseKey: "item-4-index-1",
      reducedMotion: false,
    });

    assert.equal(result.ok, true);
    assert.equal(result.phaseMatched, true);
    assert.equal(result.highlightMs, PHASE_HIGHLIGHT_MS);
    assert.equal(PHASE_HIGHLIGHT_MS, 2000);
    assert.equal(result.behavior, "smooth");
    assert.equal(scrollBehaviorForMotion(false), "smooth");
    assert.equal(result.highlighted, phase);
    assert.deepEqual(phase.scrolled, { behavior: "smooth", block: "center" });
    assert.equal(root.scrolled, null);
    assert.equal(result.focused, phase.children[2]);
    assert.equal(result.focused.phaseField, true);
    assert.deepEqual(phase.children[2].focused, { preventScroll: true });
    assert.equal(phase.children[0].focused, null);
    assert.equal(phase.children[1].focused, null);
    assert.equal(root.children[1].focused, null);
  });

  it("focuses the phase row when that phase has no field of its own", () => {
    const root = editorTree();
    const phase = root.children[2];
    phase.children.pop();
    const result = revealPhaseEditor(createDocument(root), {
      phaseKey: "item-4-index-1",
    });
    assert.equal(result.focused, phase);
    assert.deepEqual(phase.focused, { preventScroll: true });
    assert.equal(phase.children[1].focused, null);
  });

  it("uses an instant scroll and the editor's first field when the phase is not here", () => {
    const root = editorTree();
    const result = revealPhaseEditor(createDocument(root), {
      phaseKey: "item-9-index-0",
      reducedMotion: true,
    });

    assert.equal(result.ok, true);
    assert.equal(result.phaseMatched, false);
    assert.equal(result.behavior, "auto");
    assert.equal(result.highlighted, root);
    assert.deepEqual(root.scrolled, { behavior: "auto", block: "center" });
    assert.equal(result.focused, root.children[1]);
    assert.equal(result.focused.tag, "select");
    assert.deepEqual(result.focused.focused, { preventScroll: true });
  });

  it("ignores an unsafe phase key and does nothing when the editor is missing", () => {
    const root = editorTree();
    let queries = 0;
    const original = root.querySelector;
    root.querySelector = (selector) => {
      queries += 1;
      return original.call(root, selector);
    };
    const skipped = revealPhaseEditor(createDocument(root), {
      phaseKey: 'item-4-index-0"] , a',
      reducedMotion: false,
    });
    assert.equal(skipped.phaseMatched, false);
    assert.equal(skipped.focused.tag, "select");
    assert.equal(queries, 1);

    const missing = revealPhaseEditor(
      { getElementById() { return null; } },
      { phaseKey: "item-4-index-1" }
    );
    assert.equal(missing.ok, false);
    assert.equal(missing.focused, null);
    assert.equal(missing.highlightMs, 2000);
  });
});

describe("prefersReducedMotion", () => {
  it("reads the motion media query and treats a missing window as no preference", () => {
    assert.equal(
      prefersReducedMotion({
        matchMedia(query) {
          assert.equal(query, "(prefers-reduced-motion: reduce)");
          return { matches: true };
        },
      }),
      true
    );
    assert.equal(prefersReducedMotion(undefined), false);
    assert.equal(
      prefersReducedMotion({
        matchMedia() {
          throw new Error("no media");
        },
      }),
      false
    );
  });
});
