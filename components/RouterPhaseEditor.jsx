"use client";

import Link from "next/link";
import { useState } from "react";

const brutalBorder = "border-brutal border-black";
const inputClass =
  "w-full border-0 bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none ring-0 placeholder:text-black/40 focus:ring-2 focus:ring-nv-violet border-brutal border-black";
const labelClass = "text-[10px] font-black uppercase tracking-wide";

export function formatRouterPhaseSummary(phases) {
  return phases
    .map((phase) => `${phase.sequence}. ${phase.name}`)
    .join(" → ");
}

function reorderList(list, fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((phase, index) => ({ ...phase, sequence: index + 1 }));
}

/**
 * Item routers are assembled from the company's phase library only.
 * Create/edit library entries under Settings → Phases.
 */
export default function RouterPhaseEditor({
  phases,
  phaseTemplates = [],
  onAddFromTemplate,
  onRemovePhase,
  onMoveUp,
  onMoveDown,
  onReorderPhases,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleReorder = (fromIndex, toIndex) => {
    if (!onReorderPhases) return;
    const next = reorderList(phases, fromIndex, toIndex);
    if (next !== phases) onReorderPhases(next);
  };

  return (
    <div className={`w-full space-y-2 ${brutalBorder} bg-nv-paper p-2`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={labelClass}>Production router</p>
        <div className="flex flex-wrap items-center gap-2">
          {phaseTemplates.length > 0 ? (
            <label className="flex items-center gap-1">
              <span className="sr-only">Add phase from library</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  const templateId = e.target.value;
                  if (!templateId) return;
                  const template = phaseTemplates.find(
                    (row) => String(row.id) === templateId
                  );
                  if (template) onAddFromTemplate(template);
                  e.target.value = "";
                }}
                className={`${inputClass} max-w-[12rem] cursor-pointer py-1 text-[10px]`}
              >
                <option value="">Add phase…</option>
                {phaseTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-[10px] font-medium text-nv-ink/45">
              No phases in library
            </span>
          )}
          <Link
            href="/settings/phases"
            aria-label="Add phase to library"
            title="Add phase to library"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center border-brutal border-black bg-nv-cyan text-sm font-black leading-none transition-transform hover:-translate-y-0.5"
          >
            +
          </Link>
        </div>
      </div>

      {phases.length > 0 ? (
        <ul className="space-y-2 border-t-brutal border-black pt-2">
          {phases.map((phase, index) => {
            const isDragging = dragIndex === index;
            const isOver = overIndex === index && dragIndex !== index;

            return (
              <li
                key={phase.id}
                draggable={Boolean(onReorderPhases)}
                onDragStart={(e) => {
                  if (!onReorderPhases) return;
                  setDragIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragOver={(e) => {
                  if (!onReorderPhases || dragIndex == null) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overIndex !== index) setOverIndex(index);
                }}
                onDragLeave={() => {
                  if (overIndex === index) setOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from =
                    dragIndex ??
                    Number(e.dataTransfer.getData("text/plain"));
                  handleReorder(from, index);
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`space-y-2 ${brutalBorder} bg-nv-lavender/20 p-2 ${
                  isDragging ? "opacity-50" : ""
                } ${isOver ? "ring-2 ring-nv-violet" : ""} ${
                  onReorderPhases ? "cursor-grab active:cursor-grabbing" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {onReorderPhases ? (
                      <span
                        aria-hidden
                        className="select-none font-mono text-[10px] font-black leading-none text-nv-ink/40"
                        title="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                    ) : null}
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-black text-nv-ink/60">
                        {index + 1}.{" "}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wide">
                        {phase.name || "Untitled"}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMoveUp(phase.id)}
                      disabled={index === 0}
                      aria-label="Move phase up"
                      className="border-brutal border-black bg-nv-paper px-1.5 py-0.5 text-[10px] font-black disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveDown(phase.id)}
                      disabled={index === phases.length - 1}
                      aria-label="Move phase down"
                      className="border-brutal border-black bg-nv-paper px-1.5 py-0.5 text-[10px] font-black disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemovePhase(phase.id)}
                      className="text-[10px] font-black uppercase tracking-wide text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {(phase.description || phase.estimated_minutes) && (
                  <div className="space-y-1 text-[11px] font-medium text-nv-ink/65">
                    {phase.description ? <p>{phase.description}</p> : null}
                    {phase.estimated_minutes !== "" &&
                    phase.estimated_minutes != null ? (
                      <p className="font-mono text-[10px] uppercase tracking-wide text-nv-ink/45">
                        Est. {phase.estimated_minutes} min
                      </p>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[10px] font-medium text-nv-ink/50">
          No phases yet. Pick steps from your phase library
          {phaseTemplates.length === 0 ? (
            <>
              {" "}
              —{" "}
              <Link
                href="/settings/phases"
                className="font-black text-nv-violet hover:underline"
              >
                add phases in Settings
              </Link>{" "}
              first
            </>
          ) : (
            "."
          )}
        </p>
      )}
    </div>
  );
}
