"use client";

export default function RouterPhaseBadges({ phases }) {
  if (!Array.isArray(phases) || phases.length === 0) {
    return (
      <p className="text-[10px] font-medium text-nv-ink/50">
        No production phases defined.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {phases.map((phase) => (
        <span
          key={phase.id ?? phase.sequence}
          className="border-brutal border-black bg-nv-lavender/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
        >
          {phase.name}
        </span>
      ))}
    </div>
  );
}
