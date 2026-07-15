"use client";

import Link from "next/link";

function isMakeItem(item) {
  if (!item) return false;
  return (
    item.make_or_buy === "make" ||
    item.make_or_buy === true ||
    item.make_or_buy === "true"
  );
}

/**
 * Depth-first make children, then the item itself — same order batches use.
 */
export function buildNestedProductionGroups(rootItem, itemById) {
  if (!rootItem || !isMakeItem(rootItem)) return [];

  const groups = [];
  const visiting = new Set();

  function walk(item) {
    if (!item || visiting.has(String(item.id))) return;
    visiting.add(String(item.id));

    const bomLines = Array.isArray(item.bom_items) ? item.bom_items : [];
    for (const line of bomLines) {
      const child = itemById.get(String(line.component_item_id));
      if (child && isMakeItem(child)) {
        walk(child);
      }
    }

    const phases = Array.isArray(item.router_phases) ? item.router_phases : [];
    if (phases.length > 0) {
      groups.push({
        itemId: item.id,
        name: item.name,
        phases,
      });
    }

    visiting.delete(String(item.id));
  }

  walk(rootItem);
  return groups;
}

export default function NestedProductionPhases({ rootItem, itemById }) {
  const groups = buildNestedProductionGroups(rootItem, itemById);

  if (groups.length === 0) {
    return (
      <p className="text-xs font-medium text-nv-ink/55">
        No production phases yet. Add a router on this item or on make children
        in the BOM.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-medium text-nv-ink/55">
        Work queue for a batch — make children first, then this item.
      </p>
      {groups.map((group) => (
        <section
          key={group.itemId}
          className="border-brutal border-black bg-nv-lavender/15"
        >
          <header className="border-b-brutal border-black bg-nv-violet px-3 py-2 text-white">
            {group.itemId ? (
              <Link
                href={`/items/${group.itemId}`}
                className="text-sm font-black uppercase tracking-wide underline-offset-2 hover:underline"
              >
                {group.name}
              </Link>
            ) : (
              <p className="text-sm font-black uppercase tracking-wide">
                {group.name}
              </p>
            )}
          </header>
          <ol>
            {group.phases.map((phase, index) => (
              <li
                key={phase.id ?? `${group.itemId}-${index}`}
                className="flex gap-2 border-b border-black/10 px-3 py-2 text-xs font-semibold last:border-b-0"
              >
                <span className="font-mono font-black text-nv-violet">
                  {index + 1}.
                </span>
                <span>
                  {phase.name}
                  {phase.description ? (
                    <span className="font-medium text-nv-ink/55">
                      {" "}
                      — {phase.description}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
