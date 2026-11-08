export const SETUP_CHECKLIST_KEY = "upright_setup_checklist_hidden";

export const SETUP_STEP_HREFS = {
  phases: "/settings/phases",
  buy_items: "/items",
  vendors: "/settings/vendors",
  make_items: "/items/new-item",
  batches: "/batches",
};

export function setupStepHref(key) {
  return SETUP_STEP_HREFS[key] || "/items";
}

export function checklistComplete(status) {
  const steps = status?.checklist;
  return Array.isArray(steps) && steps.length > 0 && steps.every((step) => step.done === true);
}

export function applyInclude(phases, items) {
  return { phases: phases === true, items: items === true };
}

export function summarizeApply(result) {
  const createdPhases = Array.isArray(result?.phases?.created) ? result.phases.created : [];
  const createdItems = Array.isArray(result?.items?.created) ? result.items.created : [];
  const skippedPhases = Array.isArray(result?.phases?.skipped) ? result.phases.skipped : [];
  const skippedItems = Array.isArray(result?.items?.skipped) ? result.items.skipped : [];
  return { createdPhases, createdItems, skippedPhases, skippedItems };
}
