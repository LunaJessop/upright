"use client";

import { useEffect, useRef, useState } from "react";
import { UNIT_OF_MEASURE_OPTIONS } from "@/app/items/unitOfMeasureOptions";
import { compatibleUnits, normalizeUnit } from "@/lib/units";

const brutalBorder = "border-brutal border-black";
const inputClass =
  "w-full border-0 bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none ring-0 placeholder:text-black/40 focus:ring-2 focus:ring-nv-violet border-brutal border-black";
const labelClass = "text-[10px] font-black uppercase tracking-wide";

export function catalogItemLabel(catalogItems, itemId) {
  const item = catalogItems.find((row) => String(row.id) === itemId);
  if (!item) return "";
  return item.sku ? `${item.name} (${item.sku})` : item.name;
}

export function catalogItemUnit(catalogItems, itemId) {
  const item = catalogItems.find((row) => String(row.id) === itemId);
  return item?.unit_of_measure ?? "";
}

export function formatBomSummary(catalogItems, bomLines) {
  return bomLines
    .map((line) => {
      const label = catalogItemLabel(catalogItems, line.itemId);
      const stockUnit = catalogItemUnit(catalogItems, line.itemId);
      const unit = normalizeUnit(line.unitOfMeasure) || stockUnit;
      const qty = unit ? `${line.quantity} ${unit}` : line.quantity;
      return `${qty}× ${label}`;
    })
    .join(", ");
}

function catalogItemDisplay(catalogItems, itemId) {
  const item = catalogItems.find((row) => String(row.id) === itemId);
  if (!item) return null;
  return (
    <>
      <span className="font-black">{item.name}</span>
      {item.sku ? (
        <span className="font-normal text-nv-ink/70"> ({item.sku})</span>
      ) : null}
    </>
  );
}

function QuantityStepper({ value, onChange }) {
  const adjust = (delta) => {
    const current = parseFloat(value) || 0;
    const next = Math.max(0, current + delta);
    onChange(String(next));
  };

  return (
    <div className="inline-flex shrink-0 items-stretch overflow-hidden border-brutal border-black">
      <button
        type="button"
        onClick={() => adjust(-1)}
        aria-label="Decrease quantity"
        className="border-r-brutal border-black bg-nv-paper px-1.5 py-0.5 text-xs font-bold leading-none hover:bg-nv-cyan/30"
      >
        −
      </button>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 border-0 bg-nv-paper px-0.5 py-0.5 text-center text-[10px] font-semibold outline-none"
      />
      <button
        type="button"
        onClick={() => adjust(1)}
        aria-label="Increase quantity"
        className="border-l-brutal border-black bg-nv-paper px-1.5 py-0.5 text-xs font-bold leading-none hover:bg-nv-cyan/30"
      >
        +
      </button>
    </div>
  );
}

function MultiSelectDropdown({
  title,
  options,
  selectedValues,
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleOption = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((entry) => entry !== value));
      return;
    }
    onChange([...selectedValues, value]);
  };

  const triggerLabel =
    selectedValues.length === 0
      ? `Select ${title.toLowerCase()}`
      : selectedValues.length === 1
        ? (options.find((option) => option.value === selectedValues[0])?.label ??
          "1 selected")
        : `${selectedValues.length} selected`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label className="block space-y-1">
        <span className={labelClass}>{title}</span>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`${inputClass} flex w-full cursor-pointer items-center justify-between text-left`}
        >
          <span className={selectedValues.length === 0 ? "text-black/40" : ""}>
            {triggerLabel}
          </span>
          <span aria-hidden className="ml-2 shrink-0 text-[10px] font-black">
            {open ? "▲" : "▼"}
          </span>
        </button>
      </label>
      {open ? (
        <ul
          className={`absolute z-20 mt-1 max-h-40 w-full overflow-y-auto ${brutalBorder} bg-nv-paper`}
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => toggleOption(option.value)}
                  className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs font-semibold hover:bg-nv-cyan/30 ${
                    checked ? "bg-nv-cyan/20" : ""
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border-brutal border-black text-[9px] font-black ${
                      checked ? "bg-nv-cyan" : "bg-nv-paper"
                    }`}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function BomRecipeEditor({
  catalogItems,
  bomLines,
  selectedItemIds,
  onSelectedItemIdsChange,
  onAddSelected,
  onRemoveLine,
  onUpdateLineQuantity,
  onUpdateLineUnit,
  parentUnitOfMeasure = "",
}) {
  const bomOptions = catalogItems.map((item) => ({
    value: String(item.id),
    label: catalogItemLabel(catalogItems, String(item.id)),
  }));
  const parentUnit = normalizeUnit(parentUnitOfMeasure) || "item";

  return (
    <div className={`w-full space-y-2 ${brutalBorder} bg-nv-paper p-2`}>
      <p className={labelClass}>Recipe (BOM)</p>

      <div className="space-y-2">
        <MultiSelectDropdown
          title="Components"
          options={bomOptions}
          selectedValues={selectedItemIds}
          onChange={onSelectedItemIdsChange}
          className="w-full"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAddSelected}
            className="border-brutal border-black bg-nv-cyan px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1"
          >
            Add
          </button>
        </div>
      </div>

      {bomLines.length > 0 ? (
        <ul className="space-y-2 border-t-brutal border-black pt-2">
          {bomLines.map((line) => {
            const stockUnit = catalogItemUnit(catalogItems, line.itemId);
            const lineUnit =
              normalizeUnit(line.unitOfMeasure) || stockUnit || "";
            const unitOptions = compatibleUnits(
              stockUnit || lineUnit,
              UNIT_OF_MEASURE_OPTIONS
            );
            const quantityLabel = lineUnit
              ? `${lineUnit} per ${parentUnit}`
              : `Unit per ${parentUnit}`;

            return (
              <li
                key={line.id}
                className={`space-y-1.5 ${brutalBorder} bg-nv-cyan/15 p-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-[10px] leading-snug">
                    {catalogItemDisplay(catalogItems, line.itemId)}
                    {stockUnit ? (
                      <span className="mt-0.5 block font-medium text-nv-ink/55">
                        Stocked as {stockUnit}
                      </span>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveLine(line.id)}
                    className="shrink-0 text-[10px] font-black uppercase tracking-wide text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="text-[10px] font-normal normal-case tracking-normal text-nv-ink/70">
                    {quantityLabel}
                  </span>
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(quantity) =>
                      onUpdateLineQuantity(line.id, quantity)
                    }
                  />
                  {unitOptions.length > 0 ? (
                    <select
                      value={lineUnit}
                      onChange={(e) =>
                        onUpdateLineUnit?.(line.id, e.target.value)
                      }
                      aria-label="BOM unit of measure"
                      className="max-w-[9rem] border-brutal border-black bg-nv-paper px-1.5 py-1 text-[10px] font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
                    >
                      {unitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[10px] font-medium text-nv-ink/50">
          Select components above, then add them to set quantities.
        </p>
      )}
    </div>
  );
}
