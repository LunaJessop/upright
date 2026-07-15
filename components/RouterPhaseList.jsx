"use client";

function formatMinutes(value) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export default function RouterPhaseList({ phases }) {
  if (!Array.isArray(phases) || phases.length === 0) {
    return (
      <p className="text-xs font-medium text-nv-ink/55">
        No production phases defined. Add steps when editing this item.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {phases.map((phase) => {
        const duration = formatMinutes(phase.estimated_minutes);
        return (
          <li
            key={phase.id ?? phase.sequence}
            className="flex gap-3 border-brutal border-black bg-nv-lavender/15 px-3 py-2"
          >
            <span className="font-mono text-sm font-black text-nv-violet">
              {phase.sequence}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{phase.name}</p>
              {phase.description ? (
                <p className="mt-0.5 whitespace-pre-wrap text-xs font-medium text-nv-ink/70">
                  {phase.description}
                </p>
              ) : null}
              {duration ? (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-nv-ink/50">
                  Est. {duration}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
