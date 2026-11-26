"use client";

import NestedProductionPhases from "@/components/NestedProductionPhases";
import { SectionCard } from "./ItemDetailChrome";

export default function ProductionPhasesSection({ item, itemById }) {
  return (
    <div className="lg:col-span-2">
      <SectionCard title="Production phases" accent="bg-nv-purple-dark">
        <NestedProductionPhases rootItem={item} itemById={itemById} />
      </SectionCard>
    </div>
  );
}
