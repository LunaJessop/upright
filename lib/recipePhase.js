import { sortByText } from "./optionOrder.js";

export const UNSET_PHASE_LABEL = "Any / not set";

/** Optional phase id for a recipe line. Blank stays null so the server can clear it. */
export function phaseIdForPayload(phaseId) {
  if (phaseId == null || phaseId === "") return null;
  const number = Number(phaseId);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/**
 * Group rows when at least one has a phase name.
 * Rows without a name stay together under "Any / not set".
 * When every name is missing, keep one flat list and skip headings.
 */
export function groupByPhaseName(rows, nameOf = (row) => row?.phase_name) {
  const list = Array.isArray(rows) ? rows : [];
  const labelOf = (row) => {
    const raw = nameOf(row);
    return typeof raw === "string" && raw.trim() ? raw.trim() : "";
  };
  const anyNamed = list.some((row) => labelOf(row));
  if (!anyNamed) {
    return { grouped: false, groups: [{ name: null, rows: list }] };
  }

  const order = [];
  const buckets = new Map();
  for (const row of list) {
    const name = labelOf(row) || UNSET_PHASE_LABEL;
    if (!buckets.has(name)) {
      buckets.set(name, []);
      order.push(name);
    }
    buckets.get(name).push(row);
  }
  const names = order.filter((name) => name !== UNSET_PHASE_LABEL);
  if (buckets.has(UNSET_PHASE_LABEL)) names.push(UNSET_PHASE_LABEL);
  return {
    grouped: true,
    groups: names.map((name) => ({ name, rows: buckets.get(name) })),
  };
}

export function phaseChoices(templates, current) {
  const rows = sortByText(
    (Array.isArray(templates) ? templates : []).filter((phase) => phase?.id != null && phase?.name),
    (phase) => phase.name
  );
  const options = rows.map((phase) => ({
    value: String(phase.id),
    label: String(phase.name),
  }));
  const currentId = current?.phaseId == null || current.phaseId === "" ? "" : String(current.phaseId);
  if (currentId && !options.some((option) => option.value === currentId)) {
    options.push({
      value: currentId,
      label: current.phaseName ? String(current.phaseName) : "Saved phase",
    });
  }
  return options;
}
