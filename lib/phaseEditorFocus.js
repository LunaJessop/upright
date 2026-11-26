/**
 * Opening a production phase from the item page should land in that phase's
 * editor: scroll it into view, focus its first field, and highlight it.
 * The highlight stays up for PHASE_HIGHLIGHT_MS. Smooth scrolling is skipped
 * when the reader prefers reduced motion.
 */

export const PHASE_EDITOR_ID = "edit-phases";
export const PHASE_HIGHLIGHT_MS = 2000;
export const PHASE_EDITOR_HIGHLIGHT_CLASS = "ring-4 ring-nv-violet ring-offset-2";

const PHASE_KEY_PATTERN = /^item-[A-Za-z0-9._-]+-index-\d+$/;

export const PHASE_FIELD_SELECTOR = "[data-phase-field]:not([disabled])";

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([type='hidden']):not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
].join(", ");

export function isPhaseEditorKey(value) {
  return PHASE_KEY_PATTERN.test(String(value ?? ""));
}

/** Stable key shared by a listed phase and the matching row in the editor. */
export function phaseEditorKey(itemId, index) {
  if (itemId == null || itemId === "") return "";
  const id = String(itemId);
  if (!/^[A-Za-z0-9._-]+$/.test(id)) return "";
  const position = Number(index);
  if (!Number.isInteger(position) || position < 0) return "";
  return `item-${id}-index-${position}`;
}

export function phaseRowSelector(phaseKey) {
  if (!isPhaseEditorKey(phaseKey)) return "";
  return `[data-phase-key="${phaseKey}"]`;
}

export function scrollBehaviorForMotion(reducedMotion) {
  return reducedMotion ? "auto" : "smooth";
}

export function prefersReducedMotion(win) {
  try {
    return Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  } catch {
    return false;
  }
}

/**
 * Same-item phases open the editor already on screen.
 * A phase that belongs to a make child opens that item's editor instead.
 */
export function phaseEditAction(rootItemId, groupItemId, index) {
  const phaseKey = phaseEditorKey(groupItemId, index);
  if (!phaseKey) return null;
  if (String(rootItemId) === String(groupItemId)) {
    return { kind: "focus", focusId: PHASE_EDITOR_ID, phaseKey };
  }
  return {
    kind: "navigate",
    focusId: PHASE_EDITOR_ID,
    phaseKey,
    href: `/items/${groupItemId}?edit=1&phase=${encodeURIComponent(phaseKey)}#${PHASE_EDITOR_ID}`,
  };
}

function canFocusPhaseRow(row) {
  if (!row || typeof row.focus !== "function") return false;
  if (row.tabIndex === -1) return true;
  const attr = row.getAttribute?.("tabindex");
  return attr === "-1" || attr === "0";
}

/** The phase's own field, the phase row, or the editor's first control. */
export function firstPhaseField(phaseRoot, editorRoot) {
  if (phaseRoot) {
    const marked = phaseRoot.querySelector?.(PHASE_FIELD_SELECTOR);
    if (marked) return marked;
    if (canFocusPhaseRow(phaseRoot)) return phaseRoot;
    return phaseRoot.querySelector?.(FOCUSABLE_SELECTOR) || null;
  }
  return editorRoot?.querySelector?.(FOCUSABLE_SELECTOR) || null;
}

export function phaseKeyFromSearch(search) {
  const params = new URLSearchParams(String(search ?? "").replace(/^\?/, ""));
  const phase = params.get("phase") || "";
  return isPhaseEditorKey(phase) ? phase : "";
}

/**
 * Scroll the production-phase editor into view and focus the clicked phase.
 * When that phase is not in this editor, focus the editor's first field.
 */
export function revealPhaseEditor(doc, { phaseKey = "", reducedMotion = false } = {}) {
  const root = doc?.getElementById?.(PHASE_EDITOR_ID);
  if (!root) {
    return {
      ok: false,
      behavior: scrollBehaviorForMotion(reducedMotion),
      highlightMs: PHASE_HIGHLIGHT_MS,
      focused: null,
      highlighted: null,
      phaseMatched: false,
    };
  }

  const behavior = scrollBehaviorForMotion(reducedMotion);
  const rowSelector = phaseRowSelector(phaseKey);
  const phaseRoot = rowSelector ? root.querySelector?.(rowSelector) : null;
  const target = phaseRoot || root;
  target.scrollIntoView?.({ behavior, block: "center" });

  const field = firstPhaseField(phaseRoot, root);
  if (field && typeof field.focus === "function") {
    field.focus({ preventScroll: true });
  }

  return {
    ok: true,
    behavior,
    highlightMs: PHASE_HIGHLIGHT_MS,
    focused: field,
    highlighted: target,
    phaseMatched: Boolean(phaseRoot),
  };
}
