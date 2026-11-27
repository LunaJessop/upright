"use client";

import BomTreeView from "@/components/BomTreeView";
import { HELP_LABELS, HELP_TEXT } from "@/lib/helpText";
import { SectionCard } from "./ItemDetailChrome";

export default function BomSection({ item, itemById, canWrite, onStartEdit }) {
  return (
    <SectionCard
      title="BOM"
      help={HELP_TEXT.bom}
      helpLabel={HELP_LABELS.bom}
      accent="bg-nv-green-dark"
      action={
        canWrite ? (
          <button
            type="button"
            onClick={() => {
              onStartEdit();
              window.setTimeout(() => {
                document
                  .getElementById("edit-bom")
                  ?.scrollIntoView({ block: "center" });
              }, 50);
            }}
            className="shrink-0 border-brutal-xs border-black bg-nv-green-tint px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black"
          >
            Edit
          </button>
        ) : null
      }
    >
      {Array.isArray(item.bom_items) && item.bom_items.length > 0 ? (
        <>
          <p className="mb-3 text-[10px] font-medium text-nv-ink/55">
            For just one. Amounts use the unit they were entered in. Expand
            make components to see nested materials.
          </p>
          <BomTreeView
            lines={item.bom_items}
            itemById={itemById}
            tone="teal"
            parentItem={item}
            onEditItem={
              canWrite
                ? (focusId) => {
                    onStartEdit();
                    window.setTimeout(() => {
                      if (!focusId) return;
                      document
                        .getElementById(focusId)
                        ?.scrollIntoView({ block: "center" });
                    }, 50);
                  }
                : undefined
            }
          />
        </>
      ) : (
        <p className="text-xs font-medium text-nv-ink/55">
          No recipe defined yet. Use Edit to add components.
        </p>
      )}
    </SectionCard>
  );
}
