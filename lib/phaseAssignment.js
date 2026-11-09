/**
 * A recipe line stores a library phase id. A router row has its own id.
 * Those ids are never treated as the same kind of id.
 * A row remembers the library phase only when it was picked from the library,
 * or when its name matches exactly one library phase and exactly one row.
 */

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function libraryPhaseId(phase) {
  if (!phase || phase.libraryPhaseId == null || phase.libraryPhaseId === "") return "";
  return String(phase.libraryPhaseId);
}

export function resolveRouterLibraryIds(phases, templates = []) {
  const list = Array.isArray(phases) ? phases : [];
  const templateList = Array.isArray(templates) ? templates : [];
  const nameCount = new Map();
  for (const phase of list) {
    const name = clean(phase?.name);
    if (!name) continue;
    nameCount.set(name, (nameCount.get(name) || 0) + 1);
  }
  return list.map((phase) => {
    const explicit = libraryPhaseId(phase);
    if (explicit) return { ...phase, libraryPhaseId: explicit };
    const name = clean(phase?.name);
    if (!name || nameCount.get(name) !== 1) return { ...phase, libraryPhaseId: "" };
    const matches = templateList.filter((template) => clean(template?.name) === name);
    if (matches.length !== 1 || matches[0]?.id == null) return { ...phase, libraryPhaseId: "" };
    return { ...phase, libraryPhaseId: String(matches[0].id) };
  });
}

export function phaseIngredientPlan(phases, bomLines, templates = []) {
  const resolved = resolveRouterLibraryIds(phases, templates);
  const lines = Array.isArray(bomLines) ? bomLines : [];
  const idCount = new Map();
  for (const phase of resolved) {
    const id = libraryPhaseId(phase);
    if (!id) continue;
    idCount.set(id, (idCount.get(id) || 0) + 1);
  }
  const assigned = new Map(resolved.map((phase) => [phase.id, []]));
  const held = [];
  for (const line of lines) {
    const phaseId = line?.phaseId == null || line.phaseId === "" ? "" : String(line.phaseId);
    if (!phaseId) continue;
    const owners = resolved.filter((phase) => libraryPhaseId(phase) === phaseId);
    if (owners.length === 1 && idCount.get(phaseId) === 1) {
      assigned.get(owners[0].id).push(line);
      continue;
    }
    held.push({
      line,
      reason: owners.length > 1 ? "ambiguous" : "missing",
      phaseName: clean(line.phaseName),
    });
  }
  const editable = new Map(
    resolved.map((phase) => {
      const id = libraryPhaseId(phase);
      return [phase.id, Boolean(id) && idCount.get(id) === 1];
    })
  );
  return { resolved, assigned, held, editable };
}

export function setLinePhase(lines, lineId, libraryPhaseId, phaseName = "") {
  const nextId = libraryPhaseId == null || libraryPhaseId === "" ? "" : String(libraryPhaseId);
  return (Array.isArray(lines) ? lines : []).map((line) => {
    if (line.id !== lineId) return line;
    if (!nextId) return { ...line, phaseId: "", phaseName: "" };
    return { ...line, phaseId: nextId, phaseName: phaseName || line.phaseName || "" };
  });
}

export function ingredientChoice(line, targetLibraryId) {
  const current = line?.phaseId == null || line.phaseId === "" ? "" : String(line.phaseId);
  const target = targetLibraryId == null || targetLibraryId === "" ? "" : String(targetLibraryId);
  if (!current) return { action: "add", phaseName: "" };
  if (current === target) return { action: "here", phaseName: clean(line.phaseName) };
  return { action: "move", phaseName: clean(line.phaseName) || "another phase" };
}
