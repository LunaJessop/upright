"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrutalSwitch from "@/components/BrutalSwitch";
import BomRecipeEditor from "@/components/BomRecipeEditor";
import RouterPhaseEditor from "@/components/RouterPhaseEditor";
import UnitOfMeasureSelect from "@/components/UnitOfMeasureSelect";
import { useAuth } from "@/components/AuthProvider";
import { CreateItem, GetAllItems, GetRouterPhaseTemplates, GetVendors } from "@/app/api/apiHandler";

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
  defaultUnitPrice: "",
  active: true,
  vendor: UNSET_SELECT,
  bomLines: [],
  routerPhases: [],
};

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

function formToItem(form, id, vendors = []) {
  const isMake = form.makeOrBuy === true;
  const vendorId =
    isMake || form.vendor === UNSET_SELECT ? null : Number(form.vendor);
  const vendorMatch = vendors.find((v) => Number(v.id) === vendorId);
  return {
    id,
    name: form.name,
    sku: isMake ? null : form.sku.trim(),
    description: form.description,
    make_or_buy: isMake ? "make" : "buy",
    unit_of_measure: form.unitOfMeasure === UNSET_SELECT ? "" : form.unitOfMeasure,
    default_unit_price: form.defaultUnitPrice,
    active: form.active,
    vendor: vendorId,
    vendor_name: vendorMatch?.name ?? null,
    bom_items: isMake
      ? form.bomLines.map((line) => ({
          component_item_id: Number(line.itemId),
          quantity: line.quantity,
        }))
      : [],
    router_phases: isMake
      ? form.routerPhases
          .filter((phase) => phase.name.trim() !== "")
          .map((phase, index) => ({
            sequence: index + 1,
            name: phase.name.trim(),
            description: phase.description.trim(),
            estimated_minutes:
              phase.estimated_minutes.trim() === ""
                ? null
                : phase.estimated_minutes.trim(),
          }))
      : [],
  };
}

function isQueuedItemMake(item) {
  return (
    item.make_or_buy === "make" ||
    item.make_or_buy === true ||
    item.make_or_buy === "true"
  );
}

function formatQueuePrice(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value ? String(value) : "—";
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function QueuedItemDetails({ item, isSelected, onSelect }) {
  const isMake = isQueuedItemMake(item);
  const bomCount = Array.isArray(item.bom_items) ? item.bom_items.length : 0;
  const phaseCount = Array.isArray(item.router_phases) ? item.router_phases.length : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="min-w-0 flex-1 text-left"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-black">{item.name}</p>
        <span className="border-brutal border-black bg-nv-cyan/40 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">
          {isMake ? "Make" : "Buy"}
        </span>
        <span
          className={`border-brutal border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
            item.active ? "bg-nv-teal/50" : "bg-black/10 text-nv-ink/50"
          }`}
        >
          {item.active ? "Active" : "Inactive"}
        </span>
        {isSelected && (
          <span className="text-[9px] font-black uppercase tracking-wide text-nv-violet">
            Editing
          </span>
        )}
      </div>

      <p className="mt-1 text-[10px] font-semibold text-nv-ink/70">
        {item.unit_of_measure || "No unit"}
        {" · "}
        {formatQueuePrice(item.default_unit_price)}
      </p>

      {!isMake && item.sku && (
        <p className="mt-0.5 font-mono text-[10px] font-bold text-nv-ink/55">
          Part # {item.sku}
        </p>
      )}

      {!isMake && item.vendor_name && (
        <p className="mt-0.5 text-[10px] font-medium text-nv-ink/55">
          {item.vendor_name}
        </p>
      )}
      {!isMake && !item.vendor_name && item.vendor != null && (
        <p className="mt-0.5 text-[10px] font-medium text-nv-ink/55">
          Vendor #{item.vendor}
        </p>
      )}

      {isMake && (
        <p className="mt-0.5 text-[10px] font-medium text-nv-ink/55">
          {bomCount} BOM component{bomCount === 1 ? "" : "s"}
          {" · "}
          {phaseCount} router phase{phaseCount === 1 ? "" : "s"}
        </p>
      )}

      {item.description?.trim() && (
        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-nv-ink/50">
          {item.description.trim()}
        </p>
      )}
    </button>
  );
}

function queuedItemToFormFields(item, bomLineIdRef, routerPhaseIdRef) {
  const isMake = isQueuedItemMake(item);

  const bomLines = Array.isArray(item.bom_items)
    ? item.bom_items.map((line) => {
        const lineId = bomLineIdRef.current;
        bomLineIdRef.current += 1;
        return {
          id: lineId,
          itemId: String(line.component_item_id),
          quantity: String(line.quantity ?? "1"),
        };
      })
    : [];

  const routerPhases = Array.isArray(item.router_phases)
    ? item.router_phases.map((phase, index) => {
        const phaseId = routerPhaseIdRef.current;
        routerPhaseIdRef.current += 1;
        return {
          id: phaseId,
          sequence: phase.sequence ?? index + 1,
          name: phase.name ?? "",
          description: phase.description ?? "",
          estimated_minutes:
            phase.estimated_minutes == null ? "" : String(phase.estimated_minutes),
        };
      })
    : [];

  return {
    name: item.name ?? "",
    sku: item.sku ?? "",
    description: item.description ?? "",
    makeOrBuy: isMake,
    unitOfMeasure: item.unit_of_measure || UNSET_SELECT,
    defaultUnitPrice:
      item.default_unit_price == null ? "" : String(item.default_unit_price),
    active: item.active !== false,
    vendor: item.vendor == null ? UNSET_SELECT : String(item.vendor),
    bomLines,
    routerPhases,
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

function areRouterPhasesValid(routerPhases) {
  if (routerPhases.length === 0) return true;
  return routerPhases.every((phase) => phase.name.trim() !== "");
}

function isFormComplete(form) {
  const isMake = form.makeOrBuy === true;
  const baseComplete =
    form.name.trim() !== "" &&
    form.description.trim() !== "" &&
    form.unitOfMeasure !== UNSET_SELECT &&
    form.defaultUnitPrice.trim() !== "" &&
    (isMake || form.sku.trim() !== "");

  if (!baseComplete) return false;
  if (isMake) {
    return areBomLinesValid(form.bomLines) && areRouterPhasesValid(form.routerPhases);
  }
  return form.vendor !== UNSET_SELECT;
}

export default function NewItem() {
  const router = useRouter();
  const { canWrite, loading: authLoading } = useAuth();
  const nextIdRef = useRef(1);
  const bomLineIdRef = useRef(1);
  const routerPhaseIdRef = useRef(1);
  const [catalogItems, setCatalogItems] = useState([]);
  const [phaseTemplates, setPhaseTemplates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [catalogError, setCatalogError] = useState(false);
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!canWrite) {
      router.replace("/items");
    }
  }, [authLoading, canWrite, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await GetAllItems();
        const templates = await GetRouterPhaseTemplates().catch(() => []);
        const vendorRows = await GetVendors().catch(() => []);
        if (!cancelled) {
          setCatalogItems(Array.isArray(rows) ? rows.filter((row) => row.active) : []);
          setPhaseTemplates(Array.isArray(templates) ? templates : []);
          setVendors(Array.isArray(vendorRows) ? vendorRows : []);
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
  const [defaultUnitPrice, setDefaultUnitPrice] = useState(INITIAL_FORM.defaultUnitPrice);
  const [active, setActive] = useState(INITIAL_FORM.active);
  const [vendor, setVendor] = useState(INITIAL_FORM.vendor);
  const [bomLines, setBomLines] = useState(INITIAL_FORM.bomLines);
  const [routerPhases, setRouterPhases] = useState(INITIAL_FORM.routerPhases);
  const [bomSelectedIds, setBomSelectedIds] = useState([]);
  const [formError, setFormError] = useState("");
  const [editingQueueId, setEditingQueueId] = useState(null);

  const handleMakeOrBuyChange = (value) => {
    setMakeOrBuy(value);
    if (value) {
      setVendor(UNSET_SELECT);
      setSku("");
    } else {
      setBomLines([]);
      setBomSelectedIds([]);
      setRouterPhases([]);
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

  const addRouterPhaseFromTemplate = (template) => {
    const id = routerPhaseIdRef.current;
    routerPhaseIdRef.current += 1;
    setRouterPhases((prev) => [
      ...prev,
      {
        id,
        sequence: prev.length + 1,
        name: template.name ?? "",
        description: template.description ?? "",
        estimated_minutes:
          template.estimated_minutes == null ? "" : String(template.estimated_minutes),
      },
    ]);
  };

  const removeRouterPhase = (phaseId) => {
    setRouterPhases((prev) =>
      prev
        .filter((phase) => phase.id !== phaseId)
        .map((phase, index) => ({ ...phase, sequence: index + 1 }))
    );
  };

  const moveRouterPhase = (phaseId, direction) => {
    setRouterPhases((prev) => {
      const index = prev.findIndex((phase) => phase.id === phaseId);
      if (index < 0) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((phase, idx) => ({ ...phase, sequence: idx + 1 }));
    });
  };

  const form = {
    name,
    sku,
    description,
    makeOrBuy,
    unitOfMeasure,
    defaultUnitPrice,
    active,
    vendor,
    bomLines,
    routerPhases,
  };

  const canAdd = isFormComplete(form);
  const isEditingQueue = editingQueueId !== null;

  const applyFormFields = (fields) => {
    setName(fields.name);
    setSku(fields.sku);
    setDescription(fields.description);
    setMakeOrBuy(fields.makeOrBuy);
    setUnitOfMeasure(fields.unitOfMeasure);
    setDefaultUnitPrice(fields.defaultUnitPrice);
    setActive(fields.active);
    setVendor(fields.vendor);
    setBomLines(fields.bomLines);
    setRouterPhases(fields.routerPhases);
    setBomSelectedIds([]);
  };

  const resetForm = () => {
    setFormError("");
    setEditingQueueId(null);
    setName(INITIAL_FORM.name);
    setSku(INITIAL_FORM.sku);
    setDescription(INITIAL_FORM.description);
    setMakeOrBuy(INITIAL_FORM.makeOrBuy);
    setUnitOfMeasure(INITIAL_FORM.unitOfMeasure);
    setDefaultUnitPrice(INITIAL_FORM.defaultUnitPrice);
    setActive(INITIAL_FORM.active);
    setVendor(INITIAL_FORM.vendor);
    setBomLines(INITIAL_FORM.bomLines);
    setRouterPhases(INITIAL_FORM.routerPhases);
    setBomSelectedIds([]);
  };

  const selectQueuedItem = (item) => {
    setFormError("");
    setEditingQueueId(item.id);
    applyFormFields(queuedItemToFormFields(item, bomLineIdRef, routerPhaseIdRef));
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const failed = [];
      let firstError = "";
      for (const queuedItem of items) {
        // Strip the local queue id — the DB assigns its own
        const { id: _localId, ...payload } = queuedItem;
        try {
          await CreateItem(payload);
        } catch (err) {
          if (!firstError) {
            firstError = err?.message || "Unknown error";
          }
          failed.push(queuedItem);
        }
      }
      setItems(failed);
      if (failed.length === 0) {
        resetForm();
      } else if (failed.length > 0) {
        setSubmitError(
          `${failed.length} item${failed.length === 1 ? "" : "s"} failed to submit. ${firstError}`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();

    if (!isFormComplete(form)) {
      setFormError(
        makeOrBuy
          ? "Fill in all fields. Recipe and router lines must be valid."
          : "Fill in all fields and select a vendor."
      );
      return;
    }

    setFormError("");

    if (isEditingQueue) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingQueueId
            ? formToItem(form, editingQueueId, vendors)
            : item
        )
      );
      resetForm();
      return;
    }

    const id = nextIdRef.current;
    nextIdRef.current += 1;

    setItems((prev) => [...prev, formToItem(form, id, vendors)]);
    resetForm();
  };

  const removeQueuedItem = (localId) => {
    setItems((prev) => prev.filter((item) => item.id !== localId));
    if (editingQueueId === localId) {
      resetForm();
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
            <h1 className="text-xl font-black uppercase leading-tight">
              {isEditingQueue ? "Edit queued item" : "New item"}
            </h1>
            {isEditingQueue && (
              <p className="mt-1 text-[10px] font-medium text-white/80">
                Changes apply when you save back to the queue.
              </p>
            )}
          </header>

          <form
            onSubmit={handleAdd}
            className="grid grid-cols-2 gap-x-3 gap-y-2 p-4"
            aria-label="New item form"
          >
            <FreeInput title="Item name" value={name} setValue={setName} />
            {!makeOrBuy && (
              <FreeInput
                title="Vendor part #"
                value={sku}
                setValue={setSku}
                placeholder="Supplier catalog number"
              />
            )}
            <TextAreaInput
              title="Description"
              value={description}
              setValue={setDescription}
              className="col-span-2"
            />
            <label className="block space-y-1">
              <span className={labelClass}>Unit of measure</span>
              <UnitOfMeasureSelect
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                className={`${inputClass} cursor-pointer`}
                emptyValue={UNSET_SELECT}
                emptyLabel="Select unit of measure"
              />
            </label>
            <FreeInput
              title="List price"
              type="text"
              inputMode="decimal"
              value={defaultUnitPrice}
              setValue={setDefaultUnitPrice}
              placeholder="0.00"
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
              {!makeOrBuy && (
                <div className="w-full space-y-1">
                  <div className="flex items-end gap-1.5">
                    <DropdownInput
                      title="Vendor"
                      value={vendor}
                      setValue={setVendor}
                      options={vendors.map((v) => ({
                        value: String(v.id),
                        label: v.name,
                      }))}
                      className="min-w-0 flex-1"
                    />
                    <a
                      href="/settings/vendors"
                      aria-label="Add vendor"
                      title="Add vendor"
                      className="mb-0 inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center border-brutal border-black bg-nv-cyan text-sm font-black leading-none transition-transform hover:-translate-y-0.5"
                    >
                      +
                    </a>
                  </div>
                  {vendors.length === 0 && (
                    <p className="text-[10px] font-medium text-nv-ink/55">
                      No vendors yet — use + to create one
                    </p>
                  )}
                </div>
              )}
              {makeOrBuy && (
                <>
                  {catalogError && (
                    <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                      Couldn&apos;t load components from the API.
                    </p>
                  )}
                  <RouterPhaseEditor
                    phases={routerPhases}
                    phaseTemplates={phaseTemplates}
                    onAddFromTemplate={addRouterPhaseFromTemplate}
                    onRemovePhase={removeRouterPhase}
                    onMoveUp={(phaseId) => moveRouterPhase(phaseId, "up")}
                    onMoveDown={(phaseId) => moveRouterPhase(phaseId, "down")}
                    onReorderPhases={setRouterPhases}
                  />
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

            <div className="col-span-2 flex flex-col items-end gap-2">
              {formError && (
                <p className="w-full text-right text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {formError}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                {isEditingQueue && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="border-brutal border-black bg-nv-paper px-4 py-1.5 text-[10px] font-black uppercase tracking-wide text-black shadow-brutal-sm transition-transform hover:-translate-y-0.5"
                  >
                    Cancel edit
                  </button>
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
                  {isEditingQueue ? "Save to queue" : "Add to queue"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className={`min-w-0 flex-1 ${brutalChrome} bg-nv-paper`}>
          <header className="border-b-brutal border-black bg-nv-lavender px-4 py-3">
            <h2 className="text-sm font-black uppercase tracking-wide">
              Submission queue ({items.length})
            </h2>
            <p className="mt-1 text-xs font-medium text-nv-ink/70">
              Fill out the form and add as many items as you need. Click a queued
              item to edit it before submitting.
            </p>
          </header>

          <div className="p-4">
            {items.length > 0 ? (
              <>
                <ul className="space-y-2">
                  {items.map((item) => {
                    const isSelected = editingQueueId === item.id;
                    return (
                      <li
                        key={item.id}
                        className={`flex items-start justify-between gap-3 border-brutal border-black px-3 py-2.5 transition-colors ${
                          isSelected
                            ? "bg-nv-cyan/35 ring-2 ring-nv-violet ring-offset-1"
                            : "bg-nv-lavender/15 hover:bg-nv-cyan/20"
                        }`}
                      >
                        <QueuedItemDetails
                          item={item}
                          isSelected={isSelected}
                          onSelect={() => selectQueuedItem(item)}
                        />
                        <button
                          type="button"
                          onClick={() => removeQueuedItem(item.id)}
                          className="shrink-0 border-brutal border-black bg-nv-paper px-2 py-1 text-[10px] font-black uppercase tracking-wide text-red-600 transition-transform hover:-translate-y-0.5"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t-brutal border-black pt-4">
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
                    {submitting
                      ? "Submitting…"
                      : `Submit ${items.length} item${items.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              </>
            ) : (
              <div className="border-brutal border-dashed border-black/25 bg-nv-canvas/50 px-4 py-8 text-center">
                <p className="text-xs font-bold uppercase tracking-wide text-nv-ink/45">
                  Queue is empty
                </p>
                <p className="mt-2 text-xs font-medium text-nv-ink/55">
                  Use the form on the left to build one or more items, then add each
                  to the queue. When you&apos;re ready, submit them all at once.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
