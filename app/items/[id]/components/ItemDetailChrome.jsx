"use client";

import HelpIcon from "@/components/HelpIcon";
import { brutalChrome, compactInputClass } from "@/lib/chrome";

export const labelClass =
  "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

export const editInputClass = compactInputClass;

export function FieldRow({ label, value, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-black/10 py-2.5 last:border-b-0">
      <span className={`shrink-0 ${labelClass}`}>{label}</span>
      {children ?? (
        <span className="min-w-0 flex-1 break-words text-right text-sm font-semibold">
          {value === "" || value === null || value === undefined ? "—" : value}
        </span>
      )}
    </div>
  );
}

export function FieldBlock({ label, value, children }) {
  return (
    <div className="border-b border-black/10 py-3">
      <span className={`mb-2 block ${labelClass}`}>{label}</span>
      {children ?? (
        <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-nv-ink">
          {value === "" || value === null || value === undefined ? "—" : value}
        </p>
      )}
    </div>
  );
}

export function SectionCard({
  title,
  help,
  helpLabel,
  accent = "bg-nv-green-dark",
  action,
  children,
  className = "",
}) {
  return (
    <section className={`${brutalChrome} bg-nv-paper ${className}`}>
      <header
        className={`flex flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black ${accent} px-4 py-2`}
      >
        <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-black uppercase tracking-wide">
          <span>{title}</span>
          {help ? (
            <HelpIcon text={help} label={helpLabel || `Help: ${title}`} />
          ) : null}
        </h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
