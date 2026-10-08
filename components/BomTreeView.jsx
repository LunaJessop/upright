"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import RouterPhaseBadges from "@/components/RouterPhaseBadges";
import {
  bomTreeFlagActions,
  bomTreeQuantityReadout,
  resolveBomTreeQuantity,
} from "@/lib/bomTreeQuantity";
import { listClass, rowStripe } from "@/lib/chrome";

function isMakeItem(item) {
  if (!item) return false;
  return (
    item.make_or_buy === "make" ||
    item.make_or_buy === true ||
    item.make_or_buy === "true"
  );
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-800"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M8.86 1.55a1 1 0 0 0-1.72 0L1.18 12.9A1 1 0 0 0 2.04 14.4h11.92a1 1 0 0 0 .86-1.5L8.86 1.55z"
      />
      <path fill="#fff" d="M7.25 6h1.5v4.1h-1.5zM7.25 11.15h1.5V12.6h-1.5z" />
    </svg>
  );
}

function LineWarning({ flag, parentItem, component, onEditItem }) {
  const actions = bomTreeFlagActions(flag, parentItem, component);

  return (
    <div className="mt-2 flex gap-2 border-brutal border-black bg-amber-200 px-2 py-1.5 text-[11px] font-semibold leading-snug text-nv-ink">
      <WarningIcon />
      <div className="min-w-0">
        <p>
          <span className="sr-only">Warning: </span>
          {flag.message}
        </p>
        {actions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={(event) => {
                  if (!onEditItem || typeof window === "undefined") return;
                  const url = new URL(action.href, window.location.origin);
                  if (url.pathname !== window.location.pathname) return;
                  event.preventDefault();
                  onEditItem(url.hash.replace(/^#/, ""));
                }}
                className="inline-block border-brutal border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black shadow-brutal-btn transition-transform hover:-translate-y-0.5"
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BomTreeNode({
  line,
  itemById,
  depth = 0,
  index = 0,
  tone = "cyan",
  visited,
  parentMultiplier = 1,
  scaleToBatch = false,
  parentItem = null,
  onEditItem,
}) {
  const [expanded, setExpanded] = useState(false);
  const componentId = String(line.component_item_id);
  const component = itemById.get(componentId);
  const qty = resolveBomTreeQuantity(line, component, parentMultiplier);
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

  const nextVisited = useMemo(
    () => new Set(visited).add(componentId),
    [visited, componentId]
  );

  const readout = bomTreeQuantityReadout(
    qty,
    parentMultiplier,
    scaleToBatch,
    depth
  );

  return (
    <li className={rowStripe(index, tone)}>
      <div className="px-3 py-2">
        <div className="flex items-start gap-2">
          {hasNestedBom ? (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse sub-recipe" : "Expand sub-recipe"}
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-brutal-xs border-black bg-nv-cyan text-[10px] font-black leading-none"
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
                <span className="border-brutal-xs border-black bg-nv-teal/40 px-1 py-px text-[9px] font-black uppercase tracking-wide">
                  Make
                </span>
              ) : (
                <span className="border-brutal-xs border-black bg-nv-lavender/50 px-1 py-px text-[9px] font-black uppercase tracking-wide">
                  Buy
                </span>
              )}
            </div>

            {readout.details.length > 0 && (
              <p className="mt-0.5 text-[10px] font-medium text-nv-ink/55">
                {readout.details.join(" · ")}
              </p>
            )}

            {qty.flags.map((flag) => (
              <LineWarning
                key={flag.code}
                flag={flag}
                parentItem={parentItem}
                component={component}
                onEditItem={onEditItem}
              />
            ))}

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
            {readout.primary}
            <span className="block text-[10px] font-medium text-nv-ink/55">
              {readout.label}
            </span>
            {readout.note ? (
              <span className="mt-0.5 block max-w-36 text-[10px] font-medium normal-case text-nv-ink/45">
                {readout.note}
              </span>
            ) : null}
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
            <ul className={listClass}>
              {childLines.map((childLine, childIndex) => (
                <BomTreeNode
                  key={`${childLine.component_item_id}-${childIndex}`}
                  line={childLine}
                  itemById={itemById}
                  depth={depth + 1}
                  index={childIndex}
                  tone={tone}
                  visited={nextVisited}
                  parentMultiplier={qty.childMultiplier}
                  scaleToBatch={scaleToBatch}
                  parentItem={component}
                  onEditItem={onEditItem}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export default function BomTreeView({
  lines,
  itemById,
  rootMultiplier = 1,
  tone = "cyan",
  parentItem = null,
  onEditItem,
}) {
  if (!Array.isArray(lines) || lines.length === 0) return null;

  const scaleToBatch = Number(rootMultiplier) !== 1;

  return (
    <ul className={listClass}>
      {lines.map((line, index) => (
        <BomTreeNode
          key={`${line.component_item_id}-${index}`}
          index={index}
          tone={tone}
          line={line}
          itemById={itemById}
          visited={new Set()}
          parentMultiplier={Number(rootMultiplier) || 1}
          scaleToBatch={scaleToBatch}
          parentItem={parentItem}
          onEditItem={onEditItem}
        />
      ))}
    </ul>
  );
}
