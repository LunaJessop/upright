"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MIN_LABEL_GAP_PX = 16;
/** Approximate glyph width for 9px mono tabular nums */
const CHAR_WIDTH_PX = 5.5;

function formatTick(value) {
  if (!Number.isFinite(value)) return "—";
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function spaceLabels(items, width) {
  const sorted = items
    .map((item) => {
      const label = formatTick(item.value);
      const labelWidth = Math.max(label.length, 1) * CHAR_WIDTH_PX;
      const idealCenter = (item.leftPct / 100) * width;
      return {
        ...item,
        label,
        labelWidth,
        centerPx: idealCenter,
      };
    })
    .sort((a, b) => a.centerPx - b.centerPx);

  for (let pass = 0; pass < 12; pass += 1) {
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      const prevRight = prev.centerPx + prev.labelWidth / 2;
      const curLeft = cur.centerPx - cur.labelWidth / 2;
      const gap = curLeft - prevRight;
      if (gap >= MIN_LABEL_GAP_PX) continue;

      const need = MIN_LABEL_GAP_PX - gap;
      prev.centerPx -= need / 2;
      cur.centerPx += need / 2;

      const prevMin = prev.labelWidth / 2;
      const curMax = width - cur.labelWidth / 2;
      if (prev.centerPx < prevMin) {
        cur.centerPx += prevMin - prev.centerPx;
        prev.centerPx = prevMin;
      }
      if (cur.centerPx > curMax) {
        prev.centerPx -= cur.centerPx - curMax;
        cur.centerPx = curMax;
        if (prev.centerPx < prevMin) prev.centerPx = prevMin;
      }
    }
  }

  return sorted;
}

/**
 * Static stock range bar: green goal band + markers for current and planned,
 * with numeric tick labels so it reads as a number line.
 * Current/planned sit above the bar; scale ticks sit below.
 */
export default function InventoryRangeBar({
  quantity,
  plannedQuantity,
  goalMin,
  goalMax,
  unit = "",
}) {
  const labelRowRef = useRef(null);
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    const node = labelRowRef.current;
    if (!node) return undefined;

    const update = () => {
      setRowWidth(node.getBoundingClientRect().width);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
  const width = rowWidth > 0 ? rowWidth : 320;

  const markerLabels = useMemo(() => {
    const items = [];
    if (Number.isFinite(current)) {
      items.push({
        key: "current",
        value: current,
        leftPct: pct(current),
        kind: "current",
      });
    }
    if (Number.isFinite(planned) && planned !== current) {
      items.push({
        key: "planned",
        value: planned,
        leftPct: pct(planned),
        kind: "planned",
      });
    } else if (Number.isFinite(planned) && planned === current) {
      // Same value: one label covers both
      items[0] = {
        key: "both",
        value: current,
        leftPct: pct(current),
        kind: "both",
      };
    }
    return spaceLabels(items, width);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, planned, scaleMax, width]);

  const scaleTicks = useMemo(() => {
    const tickMap = new Map();
    const addTick = (value, kind) => {
      if (!Number.isFinite(value)) return;
      // Skip values already shown above as current/planned
      if (value === current || value === planned) return;
      const key = String(value);
      const existing = tickMap.get(key);
      if (existing) {
        existing.kinds.push(kind);
        return;
      }
      tickMap.set(key, { value, leftPct: pct(value), kinds: [kind] });
    };

    addTick(0, "zero");
    if (hasGoal) {
      addTick(min, "goal_min");
      addTick(max, "goal_max");
    }
    addTick(scaleMax, "max");

    return spaceLabels(
      [...tickMap.values()].map((tick) => ({
        key: `${tick.value}-${tick.kinds.join("-")}`,
        value: tick.value,
        leftPct: tick.leftPct,
        kind: tick.kinds[0],
      })),
      width
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, planned, min, max, hasGoal, scaleMax, width]);

  return (
    <div className="space-y-1.5">
      <div ref={labelRowRef} className="relative h-4 w-full">
        {markerLabels.map((tick) => (
          <span
            key={tick.key}
            className={`absolute top-0 font-mono text-[9px] font-bold tabular-nums ${
              tick.kind === "current"
                ? "text-nv-violet"
                : tick.kind === "planned"
                  ? "text-nv-ink/80"
                  : "text-nv-ink/70"
            }`}
            style={{
              left: `${tick.centerPx}px`,
              transform: "translateX(-50%)",
            }}
            title={
              tick.kind === "both"
                ? `Current & planned ${tick.label}${unitSuffix}`
                : tick.kind === "current"
                  ? `Current ${tick.label}${unitSuffix}`
                  : `Planned ${tick.label}${unitSuffix}`
            }
          >
            {tick.label}
          </span>
        ))}
      </div>

      <div className="relative h-6 w-full border border-black bg-nv-paper">
        {hasGoal && bandWidth > 0 && (
          <div
            className="absolute inset-y-0 bg-nv-teal/45"
            style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
            title={`Goal ${formatTick(min)}–${formatTick(max)}${unitSuffix}`}
          />
        )}
        <div
          className="absolute inset-y-0 w-0.5 bg-nv-violet"
          style={{ left: `calc(${currentLeft}% - 1px)` }}
          title={`Current ${formatTick(current)}${unitSuffix}`}
        />
        <div
          className="absolute top-0 h-full w-0 border-l border-dashed border-black/70"
          style={{ left: `${plannedLeft}%` }}
          title={`Planned ${formatTick(planned)}${unitSuffix}`}
        />
      </div>

      <div className="relative h-4 w-full">
        {scaleTicks.map((tick) => (
          <span
            key={tick.key}
            className="absolute top-0 font-mono text-[9px] font-bold tabular-nums text-nv-ink/55"
            style={{
              left: `${tick.centerPx}px`,
              transform: "translateX(-50%)",
            }}
            title={`${tick.label}${unitSuffix}`}
          >
            {tick.label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-[9px] font-bold uppercase tracking-wide text-nv-ink/55">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-0.5 bg-nv-violet" />
          Current {formatTick(current)}
          {unitSuffix}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-0 border-l border-dashed border-black/70" />
          Planned {formatTick(planned)}
          {unitSuffix}
        </span>
        {hasGoal ? (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-3 bg-nv-teal/45" />
            Goal {formatTick(min)}–{formatTick(max)}
            {unitSuffix}
          </span>
        ) : (
          <span>No goal set</span>
        )}
      </div>
    </div>
  );
}
