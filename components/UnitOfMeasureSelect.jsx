"use client";

import { UNIT_OF_MEASURE_GROUPS } from "@/app/items/unitOfMeasureOptions";

export default function UnitOfMeasureSelect({
  value,
  onChange,
  className = "",
  emptyValue = "",
  emptyLabel = "—",
}) {
  return (
    <select value={value} onChange={onChange} className={className}>
      <option value={emptyValue}>{emptyLabel}</option>
      {UNIT_OF_MEASURE_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
