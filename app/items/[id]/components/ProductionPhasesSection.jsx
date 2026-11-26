"use client";

import NestedProductionPhases from "@/components/NestedProductionPhases";
import {
  PHASE_EDITOR_ID,
  prefersReducedMotion,
  revealPhaseEditor,
} from "@/lib/phaseEditorFocus";
import { SectionCard } from "./ItemDetailChrome";

export default function ProductionPhasesSection({
  item,
  itemById,
  canWrite,
  onStartEdit,
  onPhaseRevealed,
}) {
  return (
    <div className="lg:col-span-2">
      <SectionCard title="Production phases" accent="bg-nv-purple-dark">
        <NestedProductionPhases
          rootItem={item}
          itemById={itemById}
          onEditItem={
            canWrite
              ? (focusId, phaseKey) => {
                  onStartEdit({ focusId, phaseKey });
                  window.setTimeout(() => {
                    if (focusId !== PHASE_EDITOR_ID) return;
                    const result = revealPhaseEditor(document, {
                      phaseKey,
                      reducedMotion: prefersReducedMotion(window),
                    });
                    if (result.ok) {
                      onPhaseRevealed(result.phaseMatched ? phaseKey : "");
                    }
                  }, 50);
                }
              : undefined
          }
        />
      </SectionCard>
    </div>
  );
}
