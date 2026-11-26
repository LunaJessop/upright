const labelClass =
  "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

/**
 * One label/value row. The last row in a column drops its rule.
 * On a wide screen the list is two columns, so the left cell of a full
 * last row (an odd child that is second from the end) drops its rule too.
 */
const fieldClass =
  "flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-black/10 py-2.5 last:border-b-0 lg:[&:nth-child(odd):nth-last-child(2)]:border-b-0";

export function BatchDataField({ label, children }) {
  return (
    <div className={fieldClass}>
      <span className={`shrink-0 ${labelClass}`}>{label}</span>
      <span className="min-w-0 flex-1 break-words text-right text-sm font-semibold">
        {children}
      </span>
    </div>
  );
}

/** Batch data: one column on a phone, two columns from the lg breakpoint up. */
export function BatchDataList({ fields }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8">
      {fields.map((field) => (
        <BatchDataField key={field.label} label={field.label}>
          {field.value}
        </BatchDataField>
      ))}
    </div>
  );
}
