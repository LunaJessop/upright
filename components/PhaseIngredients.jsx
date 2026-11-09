"use client";

import { ingredientChoice, libraryPhaseId } from "@/lib/phaseAssignment";

export function lineLabel(catalogItems, line) {
  const item = (catalogItems || []).find((row) => String(row.id) === String(line.itemId));
  if (!item) return "Ingredient";
  return item.sku ? `${item.name} (${item.sku})` : item.name;
}

export function PhaseIngredients({
  phase,
  lines,
  choices,
  catalogItems,
  editable,
  open,
  onToggle,
  onSetLinePhase,
}) {
  const targetId = libraryPhaseId(phase);
  const phaseName = String(phase?.name || "").trim() || "Untitled";
  const available = (choices || []).filter((line) => ingredientChoice(line, targetId).action !== "here");
  return (
    <div className="space-y-2 pl-1">
      {lines.length > 0 ? (
        <ul aria-label={`Ingredients on ${phaseName}`} className="space-y-1">
          {lines.map((line) => (
            <li key={line.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 flex-1 break-words text-xs font-semibold">
                {lineLabel(catalogItems, line)}
              </span>
              <button
                type="button"
                onClick={() => onSetLinePhase?.(line.id, "", "")}
                className="shrink-0 text-[10px] font-black uppercase tracking-wide text-red-600 hover:underline"
              >
                Unassign
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] font-medium text-nv-ink/50">No ingredients on this step.</p>
      )}
      {editable ? (
        <div className="space-y-2">
          <button
            type="button"
            aria-expanded={open ? "true" : "false"}
            onClick={onToggle}
            className="border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide"
          >
            Add ingredients
          </button>
          {open ? (
            <ul aria-label={`Choose ingredients for ${phaseName}`} className="space-y-1">
              {(choices || []).length === 0 ? (
                <li className="text-[10px] font-medium text-nv-ink/55">Add recipe ingredients first.</li>
              ) : null}
              {available.map((line) => {
                const choice = ingredientChoice(line, targetId);
                return (
                  <li key={line.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 flex-1 break-words text-xs font-medium">
                      {lineLabel(catalogItems, line)}
                      {choice.action === "move" ? (
                        <span className="mt-0.5 block text-[10px] font-medium text-nv-ink/60">
                          On {choice.phaseName}
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSetLinePhase?.(line.id, targetId, phase.name || "")}
                      className="shrink-0 border-brutal-xs border-black bg-nv-cyan px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                    >
                      {choice.action === "move" ? "Move here" : "Add"}
                    </button>
                  </li>
                );
              })}
              {(choices || []).length > 0 && available.length === 0 ? (
                <li className="text-[10px] font-medium text-nv-ink/55">
                  Every recipe ingredient is already on this step.
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-[10px] font-medium leading-relaxed text-nv-ink/55">
          This step is not tied to one library phase, so ingredients cannot be added here.
        </p>
      )}
    </div>
  );
}

export function HeldAssignments({ held, targets = [], catalogItems, onSetLinePhase }) {
  if (!held?.length) return null;
  return (
    <section className="space-y-2 border-t border-black/10 pt-3">
      <h3 className="text-[10px] font-black uppercase tracking-wide">Still assigned</h3>
      <p className="text-[10px] font-medium leading-relaxed text-nv-ink/60">
        These stay on the ingredient until you unassign or move them. They are not on a single step in this router.
      </p>
      <ul aria-label="Ingredients still assigned" className="space-y-2">
        {held.map(({ line, reason, phaseName }) => (
          <li key={line.id} className="space-y-1">
            <p className="break-words text-xs font-semibold">{lineLabel(catalogItems, line)}</p>
            <p className="text-[10px] font-medium text-nv-ink/60">
              {reason === "ambiguous"
                ? `Assigned to ${phaseName || "a phase"}, which is on more than one step.`
                : `Assigned to ${phaseName || "a phase"} that is not a single step here.`}
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => onSetLinePhase?.(line.id, "", "")}
                className="border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide"
              >
                Unassign
              </button>
              {targets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => onSetLinePhase?.(line.id, libraryPhaseId(target), target.name || "")}
                  className="border-brutal-xs border-black bg-nv-cyan px-2 py-1 text-[10px] font-black uppercase tracking-wide"
                >
                  Move to {target.name || "Untitled"}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
