"use client";

export function ListFilterField({ id, label, active, onClear, className = "", children }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55"
        >
          {label}
        </label>
        {active ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label}`}
            data-view-as-allow="true"
            className="inline-flex h-4 min-w-4 items-center justify-center border border-black bg-nv-paper px-0.5 text-[11px] font-black leading-none text-nv-ink"
          >
            ×
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function ClearAllFiltersButton({ onClear }) {
  return (
    <button
      type="button"
      onClick={onClear}
      data-view-as-allow="true"
      className="border-brutal-xs border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black"
    >
      Clear all
    </button>
  );
}
