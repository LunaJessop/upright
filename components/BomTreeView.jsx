"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import RouterPhaseBadges from "@/components/RouterPhaseBadges";

function isMakeItem(item) {
  if (!item) return false;
  return (
    item.make_or_buy === "make" ||
    item.make_or_buy === true ||
    item.make_or_buy === "true"
  );
}

function formatQty(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value ?? "—";
  return Number.isInteger(number) ? String(number) : number.toLocaleString("en-US", {
    maximumFractionDigits: 4,
  });
}

function BomTreeNode({
  line,
  itemById,
  depth = 0,
  visited,
  parentMultiplier = 1,
  scaleToBatch = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const componentId = String(line.component_item_id);
  const component = itemById.get(componentId);
  const unit =
    line.unit_of_measure || component?.unit_of_measure || "";
  const lineQty = Number(line.quantity);
  const qtyPerParent = Number.isNaN(lineQty) ? line.quantity : lineQty;
  const effectiveQty = Number.isNaN(lineQty) ? line.quantity : lineQty * parentMultiplier;
  const childLines =
    component && isMakeItem(component) && Array.isArray(component.bom_items)
      ? component.bom_items
      : [];
  const hasNestedBom = childLines.length > 0;
  const isCycle = visited.has(componentId);
  const isMake = isMakeItem(component);
  const phases = Array.isArray(component?.router_phases)
    ? component.router_phases
    : [];

  const nextVisited = useMemo(() => new Set(visited).add(componentId), [visited, componentId]);

  const rightQty = scaleToBatch || depth === 0 ? effectiveQty : qtyPerParent;
  const rightLabel = scaleToBatch
    ? "for batch"
    : depth === 0
      ? "per item"
      : "per parent";

  return (
    <li className={depth > 0 ? "mt-1" : ""}>
      <div
        className={`border-brutal border-black px-3 py-2 ${
          depth === 0 ? "bg-nv-cyan/15" : "bg-nv-paper"
        }`}
      >
        <div className="flex items-start gap-2">
          {hasNestedBom ? (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse sub-recipe" : "Expand sub-recipe"}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-brutal border-black bg-nv-cyan text-[10px] font-black leading-none transition-transform hover:-translate-y-0.5"
            >
              {expanded ? "−" : "+"}
            </button>
          ) : (
            <span className="mt-0.5 inline-block h-5 w-5 shrink-0" aria-hidden />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
              {component ? (
                <Link
                  href={`/items/${component.id}`}
                  className="min-w-0 truncate font-black underline-offset-2 hover:underline"
                >
                  {component.name}
                  {component.sku ? (
                    <span className="font-normal text-nv-ink/70"> ({component.sku})</span>
                  ) : null}
                </Link>
              ) : (
                <span className="font-black">Unknown component</span>
              )}
              {isMake ? (
                <span className="border-brutal border-black bg-nv-teal/40 px-1 py-px text-[9px] font-black uppercase tracking-wide">
                  Make
                </span>
              ) : (
                <span className="border-brutal border-black bg-nv-lavender/50 px-1 py-px text-[9px] font-black uppercase tracking-wide">
                  Buy
                </span>
              )}
            </div>

            {depth > 0 && !scaleToBatch && (
              <p className="mt-0.5 text-[10px] font-medium text-nv-ink/55">
                {formatQty(effectiveQty)}
                {unit ? ` ${unit}` : ""} per finished item
              </p>
            )}

            {depth > 0 && scaleToBatch && (
              <p className="mt-0.5 text-[10px] font-medium text-nv-ink/55">
                {formatQty(qtyPerParent)}
                {unit ? ` ${unit}` : ""} per parent
              </p>
            )}

            {isMake && (
              <div className="mt-2">
                <p className="mb-1 text-[9px] font-black uppercase tracking-wide text-nv-ink/45">
                  Phases
                </p>
                <RouterPhaseBadges phases={phases} />
              </div>
            )}
          </div>

          <span className="shrink-0 text-right text-xs font-semibold">
            {formatQty(rightQty)}
            {unit ? ` ${unit}` : ""}
            <span className="block text-[10px] font-medium text-nv-ink/55">
              {rightLabel}
            </span>
          </span>
        </div>
      </div>

      {expanded && hasNestedBom && (
        <div className="ml-3 mt-1 border-l-2 border-black/20 pl-3">
          {isCycle ? (
            <p className="py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
              Circular BOM reference — can&apos;t expand further
            </p>
          ) : (
            <ul className="space-y-1">
              {childLines.map((childLine, index) => (
                <BomTreeNode
                  key={`${childLine.component_item_id}-${index}`}
                  line={childLine}
                  itemById={itemById}
                  depth={depth + 1}
                  visited={nextVisited}
                  parentMultiplier={
                    Number.isNaN(lineQty) ? parentMultiplier : lineQty * parentMultiplier
                  }
                  scaleToBatch={scaleToBatch}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export default function BomTreeView({ lines, itemById, rootMultiplier = 1 }) {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  const scaleToBatch = Number(rootMultiplier) !== 1;

  return (
    <ul className="space-y-2">
      {lines.map((line, index) => (
        <BomTreeNode
          key={`${line.component_item_id}-${index}`}
          line={line}
          itemById={itemById}
          visited={new Set()}
          parentMultiplier={Number(rootMultiplier) || 1}
          scaleToBatch={scaleToBatch}
        />
      ))}
    </ul>
  );
}
