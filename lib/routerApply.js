/**
 * Copy a saved router onto an item's own phase list.
 * The item keeps that copy. Recipe lines are not changed.
 */

export function routerRecordId(value) {
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const id = Number(value.trim());
    if (Number.isSafeInteger(id) && id > 0) return id;
  }
  return null;
}

export function copyRouterPhases(router, startId) {
  const origin = Number.isInteger(startId) && startId > 0 ? startId : 1;
  const phases = Array.isArray(router?.phases) ? router.phases : [];
  return phases.map((phase, index) => {
    const templateId = routerRecordId(phase?.phase_template_id);
    return {
      id: origin + index,
      sequence: index + 1,
      name: phase?.name == null ? "" : String(phase.name),
      description: phase?.description == null ? "" : String(phase.description),
      estimated_minutes:
        phase?.estimated_minutes == null || phase?.estimated_minutes === ""
          ? ""
          : String(phase.estimated_minutes),
      libraryPhaseId: templateId == null ? "" : String(templateId),
    };
  });
}

/**
 * mode "replace" drops the item's current phases.
 * mode "append" keeps them and adds the router after the last step.
 * Any other mode leaves both lists untouched.
 */
export function startItemFromRouter({ phases, bomLines, router, mode, startId }) {
  const current = Array.isArray(phases) ? phases : [];
  const lines = Array.isArray(bomLines) ? bomLines : [];
  const origin = Number.isInteger(startId) && startId > 0 ? startId : 1;
  if (mode !== "replace" && mode !== "append") {
    return {
      applied: false,
      phases: current,
      bomLines: lines,
      sourceRouterId: null,
      sourceRouterName: "",
      nextId: origin,
    };
  }

  const incoming = copyRouterPhases(router, origin);
  const combined = mode === "append" ? [...current, ...incoming] : incoming;
  const name = typeof router?.name === "string" ? router.name.trim() : "";
  return {
    applied: true,
    phases: combined.map((phase, index) => ({ ...phase, sequence: index + 1 })),
    bomLines: lines,
    sourceRouterId: routerRecordId(router?.id),
    sourceRouterName: name,
    nextId: origin + incoming.length,
  };
}

export function withSourceRouter(payload, sourceRouterId) {
  const id = routerRecordId(sourceRouterId);
  if (id == null) return payload;
  return { ...payload, source_router_id: id };
}

export function resolveStartedFromName(sourceRouterId, routers, fallback = "") {
  const id = routerRecordId(sourceRouterId);
  const fallbackName = typeof fallback === "string" ? fallback.trim() : "";
  if (id == null) return fallbackName;
  const match = (Array.isArray(routers) ? routers : []).find(
    (row) => routerRecordId(row?.id) === id
  );
  const name = typeof match?.name === "string" ? match.name.trim() : "";
  return name || fallbackName;
}

export function displayStartedFromName({ choice, savedId, routers }) {
  if (choice) {
    const chosen = typeof choice.name === "string" ? choice.name.trim() : "";
    if (chosen) return chosen;
    return resolveStartedFromName(choice.id, routers);
  }
  return resolveStartedFromName(savedId, routers);
}
