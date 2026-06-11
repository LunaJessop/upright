"use client";

import { useEffect, useRef, useState } from "react";
import NeobrutalDataTable from "@/components/NeobrutalDataTable";
import BrutalSwitch from "@/components/BrutalSwitch";
import BomRecipeEditor from "@/components/BomRecipeEditor";
import { CreateItem, GetAllItems } from "@/app/api/apiHandler";

const brutalChrome = "border-brutal border-black shadow-brutal";
const inputClass =
  "w-full border-0 bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none ring-0 placeholder:text-black/40 focus:ring-2 focus:ring-nv-violet border-brutal border-black";
const labelClass = "text-[10px] font-black uppercase tracking-wide";

const UNSET_SELECT = "__unset__";

const INITIAL_FORM = {
  name: "",
  sku: "",
  description: "",
  makeOrBuy: false,
  unitOfMeasure: UNSET_SELECT,
  defaultCost: "",
  active: true,
  vendor: UNSET_SELECT,
  bomLines: [],
};

/* Placeholder vendor ids — swap for a vendors table lookup later */
const VENDOR_ID_OPTIONS = Array.from({ length: 10 }, (_, index) => ({
  value: String(index + 1),
  label: `Vendor ${index + 1}`,
}));

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

const UNIT_OF_MEASURE_OPTIONS = [
  { value: "ea", label: "Each (ea)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "ft", label: "Foot (ft)" },
  { value: "m", label: "Meter (m)" },
  { value: "L", label: "Liter (L)" },
  { value: "gal", label: "Gallon (gal)" },
];

function formToItem(form, id) {
  const isMake = form.makeOrBuy === true;
  return {
    id,
    name: form.name,
    sku: form.sku,
    description: form.description,
    make_or_buy: isMake ? "make" : "buy",
    unit_of_measure: form.unitOfMeasure === UNSET_SELECT ? "" : form.unitOfMeasure,
    default_cost: form.defaultCost,
    active: form.active,
    vendor: isMake || form.vendor === UNSET_SELECT ? null : Number(form.vendor),
    bom_items: isMake
      ? form.bomLines.map((line) => ({
          component_item_id: Number(line.itemId),
          quantity: line.quantity,
        }))
      : [],
  };
}

function areBomLinesValid(bomLines) {
  if (bomLines.length === 0) return true;
  return bomLines.every(
    (line) =>
      line.itemId !== UNSET_SELECT &&
      line.quantity.trim() !== "" &&
      Number(line.quantity) > 0
  );
}

function isFormComplete(form) {
  const isMake = form.makeOrBuy === true;
  const baseComplete =
    form.name.trim() !== "" &&
    form.sku.trim() !== "" &&
    form.description.trim() !== "" &&
    form.unitOfMeasure !== UNSET_SELECT &&
    form.defaultCost.trim() !== "";

  if (!baseComplete) return false;
  if (isMake) return areBomLinesValid(form.bomLines);
  return form.vendor !== UNSET_SELECT;
}

export default function NewItem() {
  const nextIdRef = useRef(1);
  const bomLineIdRef = useRef(1);
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogError, setCatalogError] = useState(false);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await GetAllItems();
        if (!cancelled) {
          setCatalogItems(Array.isArray(rows) ? rows.filter((row) => row.active) : []);
          setCatalogError(false);
        }
      } catch {
        if (!cancelled) setCatalogError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const [name, setName] = useState(INITIAL_FORM.name);
  const [sku, setSku] = useState(INITIAL_FORM.sku);
  const [description, setDescription] = useState(INITIAL_FORM.description);
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
    if (value) {
      setVendor(UNSET_SELECT);
    } else {
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
          ? "Fill in all fields. Recipe lines must have a component and quantity."
          : "Fill in all fields and select a vendor."
      );
      return;
    }

    setFormError("");

    const id = nextIdRef.current;
    nextIdRef.current += 1;

    setItems((prev) => [...prev, formToItem(form, id)]);
    resetForm();
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const failed = [];
      for (const queuedItem of items) {
        // Strip the local queue id — the DB assigns its own
        const { id: _localId, ...payload } = queuedItem;
        try {
          await CreateItem(payload);
        } catch {
          failed.push(queuedItem);
        }
      }
      setItems(failed);
      if (failed.length > 0) {
        setSubmitError(
          `${failed.length} item${failed.length === 1 ? "" : "s"} failed to submit. They remain in the list below.`
        );
      }
    } finally {
      setSubmitting(false);
    }
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
            {!makeOrBuy && (
              <DropdownInput
                title="Vendor"
                value={vendor}
                setValue={setVendor}
                options={VENDOR_ID_OPTIONS}
              />
            )}
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
                <>
                  {catalogError && (
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                      Couldn&apos;t load components from the API.
                    </p>
                  )}
                  <BomRecipeEditor
                    catalogItems={catalogItems}
                    bomLines={bomLines}
                    selectedItemIds={bomSelectedIds}
                    onSelectedItemIdsChange={setBomSelectedIds}
                    onAddSelected={addSelectedBomLines}
                    onRemoveLine={removeBomLine}
                    onUpdateLineQuantity={updateBomLineQuantity}
                  />
                </>
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
              <div className="mt-4 flex items-center justify-end gap-3">
                {submitError && (
                  <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleSubmitAll()}
                  disabled={submitting}
                  className="border-brutal border-black bg-nv-violet px-6 py-2 text-xs font-black uppercase tracking-wide text-white shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? "Submitting…" : "Submit"}
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
