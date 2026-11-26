import { routerRecordId } from "./routerApply.js";

const MAX_ROUTER_PHASES = 100;

function blankToNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function minutesForPayload(value) {
  if (value == null || value === "") return { minutes: null };
  const text = typeof value === "number" ? String(value) : String(value).trim();
  if (!/^\d+$/.test(text)) {
    return { error: "Estimated minutes must be a whole number of minutes." };
  }
  return { minutes: Number(text) };
}

export function routerPhaseSummary(phases) {
  const list = Array.isArray(phases) ? phases : [];
  if (list.length === 0) return "No phases yet";
  return list
    .map((phase, index) => `${index + 1}. ${String(phase?.name || "").trim() || "Untitled"}`)
    .join(" → ");
}

export function phaseDraftFromTemplate(template, key) {
  return {
    key,
    name: String(template?.name ?? "").trim(),
    description: template?.description == null ? "" : String(template.description),
    estimated_minutes:
      template?.estimated_minutes == null || template?.estimated_minutes === ""
        ? ""
        : template.estimated_minutes,
    phase_template_id: routerRecordId(template?.id),
  };
}

export function phaseDraftFromName(name, templates, key) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return null;
  const match = (Array.isArray(templates) ? templates : []).find(
    (template) => String(template?.name ?? "").trim() === trimmed
  );
  if (match) return phaseDraftFromTemplate(match, key);
  return {
    key,
    name: trimmed,
    description: "",
    estimated_minutes: "",
    phase_template_id: null,
  };
}

export function routerToForm(router) {
  const phases = Array.isArray(router?.phases) ? router.phases : [];
  return {
    name: router?.name == null ? "" : String(router.name),
    description: router?.description == null ? "" : String(router.description),
    phases: phases.map((phase, index) => ({
      key: phase?.id == null ? `saved-${index}` : `saved-${phase.id}`,
      name: phase?.name == null ? "" : String(phase.name),
      description: phase?.description == null ? "" : String(phase.description),
      estimated_minutes:
        phase?.estimated_minutes == null || phase?.estimated_minutes === ""
          ? ""
          : phase.estimated_minutes,
      phase_template_id: routerRecordId(phase?.phase_template_id),
    })),
  };
}

export function moveDraftPhase(phases, index, direction) {
  const list = Array.isArray(phases) ? phases : [];
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || index >= list.length || target >= list.length) {
    return list;
  }
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeDraftPhase(phases, key) {
  return (Array.isArray(phases) ? phases : []).filter((phase) => phase.key !== key);
}

export function companyRouterPayload({ name, description, phases }) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed) return { error: "Router name is required." };
  const list = Array.isArray(phases) ? phases : [];
  if (list.length > MAX_ROUTER_PHASES) {
    return { error: `A router can have at most ${MAX_ROUTER_PHASES} phases.` };
  }

  const out = [];
  for (let index = 0; index < list.length; index += 1) {
    const phase = list[index];
    const phaseName = typeof phase?.name === "string" ? phase.name.trim() : "";
    if (!phaseName) return { error: `Phase ${index + 1} needs a name.` };
    const minutes = minutesForPayload(phase?.estimated_minutes);
    if (minutes.error) return { error: minutes.error };
    const row = {
      sequence: index + 1,
      name: phaseName,
      description: blankToNull(phase?.description),
      estimated_minutes: minutes.minutes,
    };
    const templateId = routerRecordId(phase?.phase_template_id);
    if (templateId != null) row.phase_template_id = templateId;
    out.push(row);
  }

  return {
    value: {
      name: trimmed,
      description: blankToNull(description),
      phases: out,
    },
  };
}
