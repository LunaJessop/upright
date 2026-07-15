"use client";

/**
 * Static stock range bar: green goal band + markers for current and planned.
 */
export default function InventoryRangeBar({
  quantity,
  plannedQuantity,
  goalMin,
  goalMax,
  unit = "",
}) {
  const hasGoal =
    goalMin != null &&
    goalMax != null &&
    Number.isFinite(Number(goalMin)) &&
    Number.isFinite(Number(goalMax));

  const current = Number(quantity);
  const planned = Number(plannedQuantity);
  const min = hasGoal ? Number(goalMin) : 0;
  const max = hasGoal ? Number(goalMax) : 0;

  const values = [current, planned];
  if (hasGoal) values.push(min, max);
  const dataMax = Math.max(0, ...values.filter((v) => Number.isFinite(v)));
  const scaleMax = dataMax > 0 ? dataMax * 1.1 : hasGoal ? max * 1.1 || 1 : 1;

  const pct = (value) => {
    if (!Number.isFinite(value) || scaleMax <= 0) return 0;
    return Math.min(100, Math.max(0, (value / scaleMax) * 100));
  };

  const bandLeft = hasGoal ? pct(min) : 0;
  const bandWidth = hasGoal ? Math.max(0, pct(max) - pct(min)) : 0;
  const currentLeft = pct(current);
  const plannedLeft = pct(planned);
  const unitSuffix = unit ? ` ${unit}` : "";

  return (
    <div className="space-y-2">
      <div className="relative h-6 w-full border border-black bg-nv-paper">
        {hasGoal && bandWidth > 0 && (
          <div
            className="absolute inset-y-0 bg-nv-teal/45"
            style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
            title={`Goal ${min}–${max}${unitSuffix}`}
          />
        )}
        <div
          className="absolute inset-y-0 w-0.5 bg-nv-violet"
          style={{ left: `calc(${currentLeft}% - 1px)` }}
          title={`Current ${current}${unitSuffix}`}
        />
        <div
          className="absolute top-0 h-full w-0 border-l border-dashed border-black/70"
          style={{ left: `${plannedLeft}%` }}
          title={`Planned ${planned}${unitSuffix}`}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-[9px] font-bold uppercase tracking-wide text-nv-ink/55">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-0.5 bg-nv-violet" />
          Current
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-0 border-l border-dashed border-black/70" />
          Planned
        </span>
        {hasGoal ? (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-3 bg-nv-teal/45" />
            Goal band
          </span>
        ) : (
          <span>No goal set</span>
        )}
      </div>
    </div>
  );
}
