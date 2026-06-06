"use client";

import { useEffect, useRef, useState } from "react";
import NeobrutalDataTable from "@/components/NeobrutalDataTable";
import { PLACEHOLDER_ITEMS } from "@/app/items/placeholderItems";

const brutalChrome = "border-brutal border-black shadow-brutal";
const brutalBorder = "border-brutal border-black";
const inputClass =
  "w-full border-0 bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none ring-0 placeholder:text-black/40 focus:ring-2 focus:ring-nv-violet border-brutal border-black";
const labelClass = "text-[10px] font-black uppercase tracking-wide";

function BrutalSwitch({
  ariaLabel,
  value,
  setValue,
  offValue,
  onValue,
  offLabel,
  onLabel,
  className = "",
}) {
  const isOn = value === onValue;

  return (
    <div className={className}>
      <div
        className="relative inline-flex h-8 w-auto overflow-hidden rounded-full border-brutal border-black bg-nv-paper shadow-brutal-sm"
        role="group"
        aria-label={ariaLabel}
      >
        <span
          aria-hidden
          className={`absolute inset-y-0 w-1/2 bg-nv-cyan transition-transform duration-150 ease-out ${
            isOn
              ? "translate-x-full border-l-brutal border-black"
              : "translate-x-0 border-r-brutal border-black"
          }`}
        />
        <button
          type="button"
          aria-pressed={!isOn}
          onClick={() => setValue(offValue)}
          className={`relative z-10 flex items-center justify-center px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
            !isOn ? "text-black" : "text-black/45"
          }`}
        >
          {offLabel}
        </button>
        <button
          type="button"
          aria-pressed={isOn}
          onClick={() => setValue(onValue)}
          className={`relative z-10 flex items-center justify-center px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors ${
            isOn ? "text-black" : "text-black/45"
          }`}
        >
          {onLabel}
        </button>
      </div>
    </div>
  );
}

const UNSET_SELECT = "__unset__";

const INITIAL_FORM = {
  name: "",
  sku: "",
  description: "",
  itemType: UNSET_SELECT,
  makeOrBuy: false,
  unitOfMeasure: UNSET_SELECT,
  defaultCost: "",
  active: true,
  vendor: "",
  bomLines: [],
};

function catalogItemLabel(catalogItems, itemId) {
  const item = catalogItems.find((row) => String(row.id) === itemId);
  return item ? `${item.name} (${item.sku})` : "";
}

function catalogItemDisplay(catalogItems, itemId) {
  const item = catalogItems.find((row) => String(row.id) === itemId);
  if (!item) return null;
  return (
    <>
      <span className="font-black">{item.name}</span>
      <span className="font-normal text-nv-ink/70"> ({item.sku})</span>
    </>
  );
}

function formatBomSummary(catalogItems, bomLines) {
  return bomLines
    .map((line) => {
      const label = catalogItemLabel(catalogItems, line.itemId);
      const unit = catalogItemUnit(catalogItems, line.itemId);
      const qty = unit ? `${line.quantity} ${unit}` : line.quantity;
      return `${qty}× ${label}`;
    })
    .join(", ");
}

function catalogItemUnit(catalogItems, itemId) {
  const item = catalogItems.find((row) => String(row.id) === itemId);
  return item?.unit_of_measure ?? "";
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

function BomRecipeEditor({
  catalogItems,
  bomLines,
  selectedItemIds,
  onSelectedItemIdsChange,
  onAddSelected,
  onRemoveLine,
  onUpdateLineQuantity,
}) {
  const bomOptions = catalogItems.map((item) => ({
    value: String(item.id),
    label: `${item.name} (${item.sku})`,
  }));

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
            const lineUnit = catalogItemUnit(catalogItems, line.itemId);
            const quantityLabel = lineUnit ? `${lineUnit} per item` : "Unit per item";
            return (
              <li
                key={line.id}
                className={`space-y-1.5 ${brutalBorder} bg-nv-cyan/15 p-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-[10px] leading-snug">
                    {catalogItemDisplay(catalogItems, line.itemId)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveLine(line.id)}
                    className="shrink-0 text-[10px] font-black uppercase tracking-wide text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[10px] font-normal normal-case tracking-normal text-nv-ink/70">
                    {quantityLabel}
                  </span>
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(quantity) => onUpdateLineQuantity(line.id, quantity)}
                  />
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

function FreeInput({
  title,
  value,
  setValue,
  type = "text",
  inputMode,
  placeholder,
  className = "",
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className={labelClass}>{title}</span>
      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder ?? title}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function TextAreaInput({ title, value, setValue, rows = 2, className = "" }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className={labelClass}>{title}</span>
      <textarea
        placeholder={title}
        value={value}
        rows={rows}
        onChange={(e) => setValue(e.target.value)}
        className={`${inputClass} resize-none`}
      />
    </label>
  );
}

function DropdownInput({ title, value, setValue, options, className = "" }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className={labelClass}>{title}</span>
      <select
        className={`${inputClass} cursor-pointer`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value={UNSET_SELECT} disabled hidden>
          Select {title.toLowerCase()}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const ITEM_TYPE_OPTIONS = [
  { value: "raw_material", label: "Raw material" },
  { value: "component", label: "Component" },
  { value: "subassembly", label: "Subassembly" },
  { value: "finished_good", label: "Finished good" },
];

const UNIT_OF_MEASURE_OPTIONS = [
  { value: "ea", label: "Each (ea)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "ft", label: "Foot (ft)" },
  { value: "m", label: "Meter (m)" },
  { value: "L", label: "Liter (L)" },
  { value: "gal", label: "Gallon (gal)" },
];

function formToItem(form, id, catalogItems) {
  const bomLines = form.makeOrBuy
    ? form.bomLines.map((line) => {
        const item = catalogItems.find((row) => String(row.id) === line.itemId);
        return {
          item_id: line.itemId,
          name: item?.name ?? "",
          sku: item?.sku ?? "",
          quantity_per_unit: line.quantity,
        };
      })
    : [];

  return {
    id,
    name: form.name,
    sku: form.sku,
    description: form.description,
    item_type: form.itemType === UNSET_SELECT ? "" : form.itemType,
    make_or_buy: form.makeOrBuy ? "make" : "buy",
    unit_of_measure: form.unitOfMeasure === UNSET_SELECT ? "" : form.unitOfMeasure,
    default_cost: form.defaultCost,
    active: form.active,
    vendor: form.vendor,
    bom: form.makeOrBuy ? formatBomSummary(catalogItems, form.bomLines) : "",
    bom_lines: bomLines,
  };
}

function isBomValid(bomLines) {
  if (bomLines.length === 0) return false;
  return bomLines.every(
    (line) =>
      line.itemId !== UNSET_SELECT &&
      line.quantity.trim() !== "" &&
      Number(line.quantity) > 0
  );
}

function isFormComplete(form) {
  const baseComplete =
    form.name.trim() !== "" &&
    form.sku.trim() !== "" &&
    form.description.trim() !== "" &&
    form.itemType !== UNSET_SELECT &&
    form.unitOfMeasure !== UNSET_SELECT &&
    form.defaultCost.trim() !== "" &&
    form.vendor.trim() !== "";

  if (!baseComplete) return false;
  if (form.makeOrBuy && !isBomValid(form.bomLines)) return false;
  return true;
}

export default function NewItem() {
  const nextIdRef = useRef(1);
  const bomLineIdRef = useRef(1);
  const catalogItems = PLACEHOLDER_ITEMS;
  const [items, setItems] = useState([]);
  const [name, setName] = useState(INITIAL_FORM.name);
  const [sku, setSku] = useState(INITIAL_FORM.sku);
  const [description, setDescription] = useState(INITIAL_FORM.description);
  const [itemType, setItemType] = useState(INITIAL_FORM.itemType);
  const [makeOrBuy, setMakeOrBuy] = useState(INITIAL_FORM.makeOrBuy);
  const [unitOfMeasure, setUnitOfMeasure] = useState(INITIAL_FORM.unitOfMeasure);
  const [defaultCost, setDefaultCost] = useState(INITIAL_FORM.defaultCost);
  const [active, setActive] = useState(INITIAL_FORM.active);
  const [vendor, setVendor] = useState(INITIAL_FORM.vendor);
  const [bomLines, setBomLines] = useState(INITIAL_FORM.bomLines);
  const [bomSelectedIds, setBomSelectedIds] = useState([]);
  const [formError, setFormError] = useState("");

  const handleMakeOrBuyChange = (value) => {
    setMakeOrBuy(value);
    if (!value) {
      setBomLines([]);
      setBomSelectedIds([]);
    }
  };

  const addSelectedBomLines = () => {
    if (bomSelectedIds.length === 0) {
      setFormError("Select at least one component for the recipe.");
      return;
    }

    const existingIds = new Set(bomLines.map((line) => line.itemId));
    const newIds = bomSelectedIds.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      setFormError("Selected components are already in the recipe.");
      return;
    }

    const newLines = newIds.map((itemId) => {
      const lineId = bomLineIdRef.current;
      bomLineIdRef.current += 1;
      return { id: lineId, itemId, quantity: "1" };
    });

    setBomLines((prev) => [...prev, ...newLines]);
    setBomSelectedIds([]);
    setFormError("");
  };

  const removeBomLine = (lineId) => {
    setBomLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const updateBomLineQuantity = (lineId, quantity) => {
    setBomLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, quantity } : line))
    );
  };

  const form = {
    name,
    sku,
    description,
    itemType,
    makeOrBuy,
    unitOfMeasure,
    defaultCost,
    active,
    vendor,
    bomLines,
  };

  const canAdd = isFormComplete(form);

  const resetForm = () => {
    setFormError("");
    setName(INITIAL_FORM.name);
    setSku(INITIAL_FORM.sku);
    setDescription(INITIAL_FORM.description);
    setItemType(INITIAL_FORM.itemType);
    setMakeOrBuy(INITIAL_FORM.makeOrBuy);
    setUnitOfMeasure(INITIAL_FORM.unitOfMeasure);
    setDefaultCost(INITIAL_FORM.defaultCost);
    setActive(INITIAL_FORM.active);
    setVendor(INITIAL_FORM.vendor);
    setBomLines(INITIAL_FORM.bomLines);
    setBomSelectedIds([]);
  };

  const handleAdd = (e) => {
    e.preventDefault();

    if (!isFormComplete(form)) {
      setFormError(
        makeOrBuy
          ? "Fill in all fields and add at least one recipe component with quantity."
          : "Fill in all fields and select an option for each dropdown."
      );
      return;
    }

    setFormError("");

    const id = nextIdRef.current;
    nextIdRef.current += 1;

    setItems((prev) => [...prev, formToItem(form, id, catalogItems)]);
    resetForm();
  };

  const handleSubmitAll = () => {
    console.log("Submit items:", items);
  };

  return (
    <div className="min-h-screen bg-nv-canvas px-4 py-4 text-nv-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-start">
        <div className={`w-full shrink-0 lg:max-w-md ${brutalChrome} bg-nv-cyan/25`}>
          <header className="border-b-brutal border-black bg-nv-violet px-4 py-2 text-white">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
              Items
            </p>
            <h1 className="text-xl font-black uppercase leading-tight">New item</h1>
          </header>

          <form
            onSubmit={handleAdd}
            className="grid grid-cols-2 gap-x-3 gap-y-2 p-4"
            aria-label="New item form"
          >
            <FreeInput title="Item name" value={name} setValue={setName} />
            <FreeInput title="SKU" value={sku} setValue={setSku} />
            <TextAreaInput
              title="Description"
              value={description}
              setValue={setDescription}
              className="col-span-2"
            />
            <DropdownInput
              title="Item type"
              value={itemType}
              setValue={setItemType}
              options={ITEM_TYPE_OPTIONS}
            />
            <DropdownInput
              title="Unit of measure"
              value={unitOfMeasure}
              setValue={setUnitOfMeasure}
              options={UNIT_OF_MEASURE_OPTIONS}
            />
            <FreeInput
              title="Default cost"
              type="text"
              inputMode="decimal"
              value={defaultCost}
              setValue={setDefaultCost}
              placeholder="0.00"
            />
            <FreeInput
              title="Vendor"
              value={vendor}
              setValue={setVendor}
              placeholder="Vendor name"
            />
            <div className="col-span-2 flex flex-col items-start gap-2">
              <BrutalSwitch
                ariaLabel="Make or buy"
                value={makeOrBuy}
                setValue={handleMakeOrBuyChange}
                offValue={false}
                onValue={true}
                offLabel="Buy"
                onLabel="Make"
              />
              {makeOrBuy && (
                <BomRecipeEditor
                  catalogItems={catalogItems}
                  bomLines={bomLines}
                  selectedItemIds={bomSelectedIds}
                  onSelectedItemIdsChange={setBomSelectedIds}
                  onAddSelected={addSelectedBomLines}
                  onRemoveLine={removeBomLine}
                  onUpdateLineQuantity={updateBomLineQuantity}
                />
              )}
              <BrutalSwitch
                ariaLabel="Status"
                value={active}
                setValue={setActive}
                offValue={false}
                onValue={true}
                offLabel="Inactive"
                onLabel="Active"
              />
            </div>

            <div className="col-span-2 flex flex-col items-end gap-1">
              {formError && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={!canAdd}
                className={`border-brutal border-black px-5 py-1.5 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm ${
                  canAdd
                    ? "bg-nv-violet text-white transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
                    : "cursor-not-allowed bg-black/10 text-black/40 shadow-black/20"
                }`}
              >
                Add
              </button>
            </div>
          </form>
        </div>

        <div className={`min-w-0 flex-1 ${brutalChrome} bg-nv-paper p-4`}>
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide">
            Items to create ({items.length})
          </h2>
          {items.length > 0 ? (
            <>
              <div className="min-w-0 max-w-full overflow-hidden">
                <NeobrutalDataTable rows={items} />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  className="border-brutal border-black bg-nv-violet px-6 py-2 text-xs font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Submit
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs font-medium text-nv-ink/55">
              Add items with the form — they&apos;ll show up here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
