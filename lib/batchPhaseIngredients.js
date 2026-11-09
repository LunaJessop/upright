import { formatQuantity } from "./formatQuantity.js";

function cleanName(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function componentName(component) {
  const name = cleanName(component?.name);
  return name || "Ingredient";
}

function componentQuantity(component) {
  if (component?.quantity_allocated == null || component.quantity_allocated === "") {
    return "";
  }
  return formatQuantity(component.quantity_allocated, component.unit_of_measure);
}

function componentKey(component, index) {
  if (component?.id != null) return `component-${component.id}`;
  if (component?.item_id != null) return `item-${component.item_id}`;
  return `line-${index}`;
}

/**
 * Place each batch ingredient on a production step.
 *
 * A batch step's source_phase_id is the item's router row. An ingredient's
 * phase_id is the library phase chosen in the recipe. Those ids are not the
 * same kind of id, so they are not compared. The ingredient is listed on a
 * step only when its phase name matches exactly one step on this batch.
 * Anything else stays in `unassigned` once, and is not copied onto every step.
 */
export function associateBatchPhaseIngredients(phases, components) {
  const phaseList = Array.isArray(phases) ? phases : [];
  const componentList = Array.isArray(components) ? components : [];
  const byPhaseId = new Map(phaseList.map((phase) => [phase.id, []]));
  const idsByName = new Map();

  for (const phase of phaseList) {
    const name = cleanName(phase?.name);
    if (!name) continue;
    const ids = idsByName.get(name) ?? [];
    ids.push(phase.id);
    idsByName.set(name, ids);
  }

  const unassigned = [];
  componentList.forEach((component, index) => {
    const entry = {
      key: componentKey(component, index),
      name: componentName(component),
      quantity: componentQuantity(component),
      phaseName: cleanName(component?.phase_name),
      reason: "unset",
    };
    const assigned = component?.phase_id != null && component.phase_id !== "" && entry.phaseName;
    if (!assigned) {
      unassigned.push(entry);
      return;
    }
    const matches = idsByName.get(entry.phaseName) ?? [];
    if (matches.length === 1) {
      const list = byPhaseId.get(matches[0]);
      if (list) {
        list.push(entry);
        return;
      }
    }
    unassigned.push({
      ...entry,
      reason: matches.length > 1 ? "ambiguous" : "missing",
    });
  });

  return { byPhaseId, unassigned };
}

export function unassignedIngredientNote(ingredient) {
  if (!ingredient || ingredient.reason === "unset") return "Not assigned to a phase.";
  if (ingredient.reason === "ambiguous") {
    return `Assigned to ${ingredient.phaseName}, which is on more than one step.`;
  }
  if (ingredient.phaseName) {
    return `Assigned to ${ingredient.phaseName}, which is not a step on this batch.`;
  }
  return "Not assigned to a phase.";
}
