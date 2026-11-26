"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeItemUnit,
  DeleteItem,
  GetRouterPhaseTemplates,
  GetTags,
  UpdateItem,
} from "@/app/api/apiHandler";
import BomRecipeEditor from "@/components/BomRecipeEditor";
import BrutalSwitch from "@/components/BrutalSwitch";
import CrossKindUnitDialog from "@/components/CrossKindUnitDialog";
import RouterPhaseEditor from "@/components/RouterPhaseEditor";
import TagPicker from "@/components/TagPicker";
import { useToast } from "@/components/Toast";
import UnitOfMeasureSelect from "@/components/UnitOfMeasureSelect";
import { brutalChrome } from "@/lib/chrome";
import { previewCrossKindWithDraft } from "@/lib/crossKindPreview";
import {
  itemToBomLines,
  itemToDraft,
  itemToRouterPhases,
  routerPhasesToPayload,
  formatDate,
} from "@/lib/itemDetail";
import {
  isCrossKindUnitChange,
  itemEditorEscapeAction,
  planStockUnitChange,
  priceAfterCrossKindChange,
  priceAfterUnitChange,
  recipeParentUnitWhileEditing,
  scaledFormAfterCrossKindChange,
  scaleOwnRecipeForCrossKind,
  scaleRecipeQuantities,
} from "@/lib/itemUnitChange";
import { sortByText } from "@/lib/optionOrder";
import { isMakeItem as isMakeFlag } from "@/lib/pricing";
import { phaseIdForPayload } from "@/lib/recipePhase";
import {
  removeTagById,
  renameTagInList,
  tagsForSave,
  upsertTagCatalog,
} from "@/lib/tagCreate";
import { editInputClass, FieldBlock, FieldRow, labelClass } from "./ItemDetailChrome";

export function useItemEditor({
  id,
  item,
  setItem,
  setPhaseTemplates,
  setTagCatalog,
  catalogItems,
  phaseTemplates,
  reloadInventory,
  reloadPurchaseLots,
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draftTags, setDraftTags] = useState([]);
  const [bomLines, setBomLines] = useState([]);
  const [bomSelectedIds, setBomSelectedIds] = useState([]);
  const [routerPhases, setRouterPhases] = useState([]);
  const [crossKind, setCrossKind] = useState(null);
  const bomLineIdRef = useRef(1);
  const routerPhaseIdRef = useRef(1);

  const setDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const changeDraftUnit = (nextUnit) => {
    if (isCrossKindUnitChange(draft?.unit_of_measure, nextUnit)) {
      setDraftField("unit_of_measure", nextUnit);
      setSaveError("");
      return;
    }
    const scaled = scaleRecipeQuantities(
      bomLines,
      draft?.unit_of_measure,
      nextUnit
    );
    if (!scaled.ok) {
      setSaveError(scaled.error);
      toast.error(scaled.error);
      return;
    }
    setBomLines(scaled.lines);
    setDraftField("unit_of_measure", nextUnit);
    setSaveError("");
  };

  const startEditing = (source) => {
    const row = source ?? item;
    if (!row) return;
    setDraft(itemToDraft(row));
    setDraftTags(
      Array.isArray(row.tags)
        ? row.tags.map((tag) => ({
            ...(tag.id != null ? { id: Number(tag.id) } : {}),
            name: String(tag.name ?? "").trim(),
          }))
        : []
    );
    setBomLines(itemToBomLines(row, bomLineIdRef.current));
    bomLineIdRef.current += (row.bom_items?.length ?? 0) + 1;
    setRouterPhases(itemToRouterPhases(row, routerPhaseIdRef.current));
    routerPhaseIdRef.current += (row.router_phases?.length ?? 0) + 1;
    setBomSelectedIds([]);
    setSaveError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    setDraftTags([]);
    setBomLines([]);
    setRouterPhases([]);
    setBomSelectedIds([]);
    setSaveError("");
    setConfirmingDelete(false);
    setDeleting(false);
    setCrossKind(null);
  };

  const addSelectedBomLines = () => {
    if (bomSelectedIds.length === 0) {
      setSaveError("Select at least one component for the recipe.");
      return;
    }
    const existingIds = new Set(bomLines.map((line) => line.itemId));
    const newIds = bomSelectedIds.filter((entry) => !existingIds.has(entry));
    if (newIds.length === 0) {
      setSaveError("Selected components are already in the recipe.");
      return;
    }
    const newLines = newIds.map((itemId) => {
      const lineId = bomLineIdRef.current;
      bomLineIdRef.current += 1;
      const catalogItem = catalogItems.find(
        (row) => String(row.id) === String(itemId)
      );
      return {
        id: lineId,
        itemId,
        quantity: "1",
        unitOfMeasure: catalogItem?.unit_of_measure ?? "",
        phaseId: "",
        phaseName: "",
      };
    });
    setBomLines((prev) => [...prev, ...newLines]);
    setBomSelectedIds([]);
    setSaveError("");
  };

  const removeBomLine = (lineId) => {
    setBomLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const updateBomLineQuantity = (lineId, quantity) => {
    setBomLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, quantity } : line))
    );
  };

  const updateBomLineUnit = (lineId, unitOfMeasure) => {
    setBomLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, unitOfMeasure } : line
      )
    );
  };

  const updateBomLinePhase = (lineId, phaseId) => {
    const phase = phaseTemplates.find((row) => String(row.id) === String(phaseId));
    setBomLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? {
              ...line,
              phaseId,
              phaseName: phase?.name ?? (phaseId ? line.phaseName : ""),
            }
          : line
      )
    );
  };

  const addRouterPhaseFromTemplate = (template) => {
    const phaseId = routerPhaseIdRef.current;
    routerPhaseIdRef.current += 1;
    setRouterPhases((prev) => [
      ...prev,
      {
        id: phaseId,
        sequence: prev.length + 1,
        name: template.name ?? "",
        description: template.description ?? "",
        estimated_minutes:
          template.estimated_minutes == null ? "" : String(template.estimated_minutes),
        libraryPhaseId: template.id == null ? "" : String(template.id),
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

  const persistDraft = async ({ unitPlan, changedItem, lines, draftSnapshot }) => {
    const source = draftSnapshot ?? draft;
    const isMakeDraft = source.make_or_buy === "make";
    const blankToNull = (value) => {
      const text = value == null ? "" : String(value).trim();
      return text === "" ? null : text;
    };
    const crossFactor = unitPlan.crossFactor;
    const alreadyScaled = unitPlan.alreadyScaled === true;
    const unitCost = alreadyScaled
      ? source.unit_cost
      : unitPlan.action === "change" && changedItem
        ? priceAfterUnitChange(
            item.unit_cost,
            source.unit_cost,
            changedItem.unit_cost,
            unitPlan.factor
          )
        : unitPlan.action === "cross" && changedItem && crossFactor
          ? priceAfterCrossKindChange(
              item.unit_cost,
              source.unit_cost,
              changedItem.unit_cost,
              crossFactor
            )
          : source.unit_cost;
    const unitSellPrice = alreadyScaled
      ? source.unit_sell_price
      : unitPlan.action === "change" && changedItem
        ? priceAfterUnitChange(
            item.unit_sell_price,
            source.unit_sell_price,
            changedItem.unit_sell_price,
            unitPlan.factor
          )
        : unitPlan.action === "cross" && changedItem && crossFactor
          ? priceAfterCrossKindChange(
              item.unit_sell_price,
              source.unit_sell_price,
              changedItem.unit_sell_price,
              crossFactor
            )
          : source.unit_sell_price;
    const recipeLines =
      !alreadyScaled && unitPlan.action === "cross" && crossFactor
        ? scaleOwnRecipeForCrossKind(lines, crossFactor)
        : lines;
    const payload = {
      ...item,
      ...source,
      name: source.name.trim(),
      sku: null,
      description: source.description.trim(),
      unit_of_measure: unitPlan.unitOfMeasure,
      default_unit_price: isMakeDraft
        ? blankToNull(unitSellPrice)
        : blankToNull(unitCost),
      unit_cost: isMakeDraft ? null : blankToNull(unitCost),
      unit_sell_price: isMakeDraft ? blankToNull(unitSellPrice) : null,
      vendor: isMakeDraft || source.vendor === "" ? null : Number(source.vendor),
      bom_items: isMakeDraft
        ? recipeLines.map((line) => ({
            component_item_id: Number(line.itemId),
            quantity: line.quantity,
            unit_of_measure: line.unitOfMeasure || null,
            phase_id: phaseIdForPayload(line.phaseId),
          }))
        : [],
      router_phases: isMakeDraft ? routerPhasesToPayload(routerPhases) : [],
      tags: tagsForSave(draftTags),
    };
    const updated = await UpdateItem(id, payload);
    setItem(updated && updated.id ? updated : payload);
    const templates = await GetRouterPhaseTemplates().catch(() => []);
    setPhaseTemplates(Array.isArray(templates) ? templates : []);
    const tagRows = await GetTags().catch(() => []);
    setTagCatalog(Array.isArray(tagRows) ? tagRows : []);
    setEditing(false);
    setDraft(null);
    setDraftTags([]);
    setBomLines([]);
    setRouterPhases([]);
    setBomSelectedIds([]);
    setCrossKind(null);
    if (unitPlan.action === "change" || unitPlan.action === "cross") {
      await reloadInventory();
      if (!isMakeFlag(item.make_or_buy)) await reloadPurchaseLots();
    }
    toast.success("Item saved.");
  };

  const saveDraft = async () => {
    if (!draft.name.trim()) {
      const message = "Name is required.";
      setSaveError(message);
      toast.error(message);
      return;
    }
    const isMakeDraft = draft.make_or_buy === "make";
    if (
      isMakeDraft &&
      bomLines.some((line) => !(Number(line.quantity) > 0))
    ) {
      const message = "Every recipe component needs a quantity greater than zero.";
      setSaveError(message);
      toast.error(message);
      return;
    }
    if (
      isMakeDraft &&
      routerPhases.some((phase) => !phase.name.trim())
    ) {
      const message = "Every router phase needs a name.";
      setSaveError(message);
      toast.error(message);
      return;
    }
    const unitPlan = planStockUnitChange(
      item.unit_of_measure,
      draft.unit_of_measure
    );
    if (unitPlan.action === "reject") {
      setSaveError(unitPlan.error);
      toast.error(unitPlan.error);
      return;
    }
    setSaving(true);
    setSaveError("");
    let unitChangedOnServer = false;
    try {
      let changedItem = null;
      if (unitPlan.action === "change" || unitPlan.action === "cross") {
        changedItem = await ChangeItemUnit(id, unitPlan.unitOfMeasure);
        unitChangedOnServer = true;
        if (changedItem?.id) setItem(changedItem);
      }
      await persistDraft({ unitPlan, changedItem, lines: bomLines });
    } catch (err) {
      if (unitPlan.action === "cross" && err?.code === "CONVERSION_FACTOR_REQUIRED") {
        setCrossKind({
          question: err.message,
          factorInput: "",
          factorError: "",
          preview: null,
          busy: false,
          unitOfMeasure: unitPlan.unitOfMeasure,
        });
        return;
      }
      if (unitChangedOnServer) {
        await reloadInventory();
      }
      const message = unitChangedOnServer
        ? `The unit changed, but the other edits did not save. ${err?.message || "Failed to save changes."}`
        : err?.message || "Failed to save changes.";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const cancelCrossKind = () => {
    setDraft((prev) =>
      prev ? { ...prev, unit_of_measure: item?.unit_of_measure ?? "" } : prev
    );
    setCrossKind(null);
  };

  const escapeActionRef = useRef(null);
  escapeActionRef.current = () => {
    const action = itemEditorEscapeAction({
      busy: saving || deleting,
      unitDialogOpen: crossKind != null,
    });
    if (action === "ignore") return;
    if (action === "dismiss-unit-dialog") {
      cancelCrossKind();
      return;
    }
    cancelEditing();
  };

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      escapeActionRef.current?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  const previewCrossKind = async () => {
    if (!crossKind) return;
    if (!String(crossKind.factorInput ?? "").trim()) {
      setCrossKind((prev) => ({
        ...prev,
        factorError: "Enter a number greater than zero.",
      }));
      return;
    }
    setCrossKind((prev) => ({ ...prev, busy: true, factorError: "" }));
    try {
      const preview = await ChangeItemUnit(id, {
        unitOfMeasure: crossKind.unitOfMeasure,
        factor: crossKind.factorInput,
        dryRun: true,
      });
      const namedLines = bomLines.map((line) => {
        const catalogItem = catalogItems.find(
          (row) => String(row.id) === String(line.itemId)
        );
        return {
          ...line,
          componentName: catalogItem?.name || "",
        };
      });
      const shown = previewCrossKindWithDraft(preview, {
        savedUnitCost: item?.unit_cost,
        savedUnitSellPrice: item?.unit_sell_price,
        draft,
        lines: namedLines,
        factor: preview?.factor,
      });
      setCrossKind((prev) => ({
        ...prev,
        busy: false,
        preview: shown,
        factorError: "",
      }));
    } catch (err) {
      if (
        err?.code === "INVALID_CONVERSION_FACTOR" ||
        err?.code === "CONVERSION_FACTOR_REQUIRED"
      ) {
        setCrossKind((prev) => ({
          ...prev,
          busy: false,
          preview: null,
          factorError: err.message,
        }));
        return;
      }
      setCrossKind((prev) => ({ ...prev, busy: false }));
      toast.error(err?.message || "Could not preview the unit change.");
    }
  };

  const confirmCrossKind = async () => {
    if (!crossKind?.preview || !draft) return;
    const factor = Number(crossKind.factorInput);
    if (!Number.isFinite(factor) || factor <= 0) {
      setCrossKind((prev) =>
        prev
          ? {
              ...prev,
              preview: null,
              factorError: "Enter a number greater than zero.",
            }
          : prev
      );
      return;
    }
    setCrossKind((prev) => ({ ...prev, busy: true }));
    setSaving(true);
    let unitChangedOnServer = false;
    try {
      const changedItem = await ChangeItemUnit(id, {
        unitOfMeasure: crossKind.unitOfMeasure,
        factor,
      });
      unitChangedOnServer = true;
      const scaled = scaledFormAfterCrossKindChange({
        savedUnitCost: item?.unit_cost,
        savedUnitSellPrice: item?.unit_sell_price,
        draft,
        lines: bomLines,
        convertedUnitCost: changedItem?.unit_cost,
        convertedUnitSellPrice: changedItem?.unit_sell_price,
        factor,
        unitOfMeasure: crossKind.unitOfMeasure,
      });
      if (changedItem?.id) setItem(changedItem);
      setDraft(scaled.draft);
      setBomLines(scaled.lines);
      await persistDraft({
        unitPlan: {
          action: "cross",
          unitOfMeasure: crossKind.unitOfMeasure,
          crossFactor: factor,
          alreadyScaled: true,
        },
        changedItem,
        lines: scaled.lines,
        draftSnapshot: scaled.draft,
      });
    } catch (err) {
      if (!unitChangedOnServer && err?.code === "INVALID_CONVERSION_FACTOR") {
        setCrossKind((prev) => ({
          ...prev,
          busy: false,
          preview: null,
          factorError: err.message,
        }));
        return;
      }
      const message = unitChangedOnServer
        ? `The unit changed, but the other edits did not save. ${err?.message || "Failed to save changes."}`
        : err?.message || "Could not change the unit.";
      setSaveError(message);
      toast.error(message);
      if (unitChangedOnServer) {
        setCrossKind(null);
        await reloadInventory();
      } else {
        setCrossKind((prev) => (prev ? { ...prev, busy: false } : prev));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setSaveError("");
    try {
      await DeleteItem(id);
      toast.success("Item deleted.");
      try {
        await router.push("/items");
      } catch {
        window.location.assign("/items");
      }
    } catch (err) {
      const message = err?.message || "Failed to delete item.";
      setSaveError(message);
      toast.error(message);
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  useEffect(() => {
    if (!editing || typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (hash !== "edit-bom" && hash !== "edit-stock-unit") return;
    document.getElementById(hash)?.scrollIntoView({ block: "center" });
  }, [editing]);

  return {
    editing,
    draft,
    saving,
    deleting,
    confirmingDelete,
    setConfirmingDelete,
    saveError,
    setSaveError,
    draftTags,
    setDraftTags,
    bomLines,
    bomSelectedIds,
    setBomSelectedIds,
    routerPhases,
    setRouterPhases,
    crossKind,
    setCrossKind,
    setDraft,
    setDraftField,
    changeDraftUnit,
    startEditing,
    cancelEditing,
    addSelectedBomLines,
    removeBomLine,
    updateBomLineQuantity,
    updateBomLineUnit,
    updateBomLinePhase,
    addRouterPhaseFromTemplate,
    removeRouterPhase,
    moveRouterPhase,
    saveDraft,
    previewCrossKind,
    confirmCrossKind,
    cancelCrossKind,
    handleDelete,
  };
}

export default function EditItemModal({
  editor,
  item,
  catalogItems,
  phaseTemplates,
  vendors,
  tagCatalog,
  setTagCatalog,
  setItem,
}) {
  const {
    editing,
    draft,
    saving,
    deleting,
    confirmingDelete,
    setConfirmingDelete,
    saveError,
    setSaveError,
    draftTags,
    setDraftTags,
    bomLines,
    bomSelectedIds,
    setBomSelectedIds,
    routerPhases,
    setRouterPhases,
    crossKind,
    setCrossKind,
    setDraft,
    setDraftField,
    changeDraftUnit,
    cancelEditing,
    addSelectedBomLines,
    removeBomLine,
    updateBomLineQuantity,
    updateBomLineUnit,
    updateBomLinePhase,
    addRouterPhaseFromTemplate,
    removeRouterPhase,
    moveRouterPhase,
    saveDraft,
    previewCrossKind,
    confirmCrossKind,
    cancelCrossKind,
    handleDelete,
  } = editor;

  if (!item) return null;

  return (
    <>
      <CrossKindUnitDialog
        request={crossKind}
        onFactorChange={(value) =>
          setCrossKind((prev) =>
            prev ? { ...prev, factorInput: value, factorError: "" } : prev
          )
        }
        onPreview={() => void previewCrossKind()}
        onConfirm={() => void confirmCrossKind()}
        onCancel={cancelCrossKind}
      />

      {editing && draft && (
        <>
          <button
            type="button"
            aria-label="Close edit item"
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => {
              if (!saving && !deleting) cancelEditing();
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-item-title"
            className={`fixed left-3 right-3 top-[5vh] z-50 mx-auto flex max-h-[90vh] w-auto max-w-3xl flex-col ${brutalChrome} bg-nv-paper sm:left-6 sm:right-6`}
          >
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black bg-nv-purple-dark px-4 py-2">
              <h2
                id="edit-item-title"
                className="text-sm font-black uppercase tracking-wide"
              >
                Edit item
              </h2>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {confirmingDelete ? (
                  <>
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                      Delete &quot;{item.name}&quot;?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(false);
                        setSaveError("");
                      }}
                      disabled={deleting}
                      className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={deleting}
                      className="border-brutal-xs border-black bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                    >
                      {deleting ? "Deleting…" : "Yes, delete"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(true);
                        setSaveError("");
                      }}
                      disabled={saving || deleting}
                      className="border-brutal-xs border-black bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving || deleting}
                      className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveDraft()}
                      disabled={saving || deleting}
                      className="border-brutal-xs border-black bg-nv-violet px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {saveError && (
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-red-700">
                  {saveError}
                </p>
              )}
              <div className="space-y-1">
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <FieldRow label="Name">
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => setDraftField("name", e.target.value)}
                      className={editInputClass}
                    />
                  </FieldRow>
                </div>

                <FieldBlock label="Description">
                  <textarea
                    rows={4}
                    value={draft.description}
                    onChange={(e) => setDraftField("description", e.target.value)}
                    className={`${editInputClass} min-h-[5.5rem] resize-y leading-relaxed`}
                    placeholder="Optional notes about this item…"
                  />
                </FieldBlock>

                <div className="border-b border-black/10 py-3">
                  <TagPicker
                    value={draftTags}
                    onChange={setDraftTags}
                    catalog={tagCatalog}
                    onCatalogAdd={(tag) => {
                      setTagCatalog((prev) => upsertTagCatalog(prev, tag));
                    }}
                    onTagRenamed={(tag) => {
                      setTagCatalog((prev) => upsertTagCatalog(prev, tag));
                      setDraftTags((prev) => renameTagInList(prev, tag.id, tag.name));
                      setItem((prev) =>
                        prev
                          ? { ...prev, tags: renameTagInList(prev.tags, tag.id, tag.name) }
                          : prev
                      );
                    }}
                    onTagDeleted={(tag) => {
                      setTagCatalog((prev) => removeTagById(prev, tag.id));
                      setDraftTags((prev) => removeTagById(prev, tag.id));
                      setItem((prev) =>
                        prev
                          ? { ...prev, tags: removeTagById(prev.tags, tag.id) }
                          : prev
                      );
                    }}
                  />
                </div>

                <FieldRow label="Make or buy">
                  <BrutalSwitch
                    ariaLabel="Make or buy"
                    value={draft.make_or_buy}
                    setValue={(value) => {
                      setDraft((prev) => ({
                        ...prev,
                        make_or_buy: value,
                        sku: "",
                        vendor: value === "make" ? "" : prev.vendor,
                        unit_cost:
                          value === "buy"
                            ? prev.unit_cost || prev.unit_sell_price
                            : "",
                        unit_sell_price:
                          value === "make"
                            ? prev.unit_sell_price || prev.unit_cost
                            : "",
                      }));
                    }}
                    offValue="buy"
                    onValue="make"
                    offLabel="Buy"
                    onLabel="Make"
                  />
                </FieldRow>

                {draft.make_or_buy === "make" && (
                  <div className="border-b border-black/10 py-3">
                    <RouterPhaseEditor
                      phases={routerPhases}
                      phaseTemplates={phaseTemplates}
                      bomLines={bomLines}
                      catalogItems={catalogItems}
                      onSetLinePhase={updateBomLinePhase}
                      onAddFromTemplate={addRouterPhaseFromTemplate}
                      onRemovePhase={removeRouterPhase}
                      onMoveUp={(phaseId) => moveRouterPhase(phaseId, "up")}
                      onMoveDown={(phaseId) => moveRouterPhase(phaseId, "down")}
                      onReorderPhases={setRouterPhases}
                      tone="cyan"
                    />
                  </div>
                )}

                {draft.make_or_buy === "buy" && (
                  <FieldRow label="Vendor">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={draft.vendor}
                          onChange={(e) => setDraftField("vendor", e.target.value)}
                          className={`${editInputClass} cursor-pointer`}
                        >
                          <option value="">—</option>
                          {sortByText(vendors, (vendor) => vendor.name).map((vendor) => (
                            <option key={vendor.id} value={String(vendor.id)}>
                              {vendor.name}
                            </option>
                          ))}
                        </select>
                        <Link
                          href="/settings/vendors"
                          aria-label="Add vendor"
                          title="Add vendor"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center border-brutal-xs border-black bg-nv-cyan text-sm font-black leading-none transition-transform hover:-translate-y-0.5"
                        >
                          +
                        </Link>
                      </div>
                      {vendors.length === 0 && (
                        <p className="text-right text-[10px] font-medium text-nv-ink/50">
                          No vendors yet — use + to create one
                        </p>
                      )}
                    </div>
                  </FieldRow>
                )}

                {draft.make_or_buy === "make" && (
                  <div id="edit-bom" className="border-b border-black/10 py-3">
                    <BomRecipeEditor
                      catalogItems={catalogItems}
                      bomLines={bomLines}
                      selectedItemIds={bomSelectedIds}
                      onSelectedItemIdsChange={setBomSelectedIds}
                      onAddSelected={addSelectedBomLines}
                      onRemoveLine={removeBomLine}
                      onUpdateLineQuantity={updateBomLineQuantity}
                      onUpdateLineUnit={updateBomLineUnit}
                      parentUnitOfMeasure={recipeParentUnitWhileEditing(
                        item?.unit_of_measure,
                        draft.unit_of_measure
                      )}
                      tone="cyan"
                    />
                  </div>
                )}

                <div className="grid gap-x-6 sm:grid-cols-2">
                  <div id="edit-stock-unit">
                    <FieldRow label="Unit of measure">
                      <UnitOfMeasureSelect
                        value={draft.unit_of_measure}
                        onChange={(e) => changeDraftUnit(e.target.value)}
                        className={`${editInputClass} cursor-pointer`}
                      />
                    </FieldRow>
                  </div>
                  {draft.make_or_buy === "make" ? (
                    <FieldRow label="Sell price">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={draft.unit_sell_price}
                        onChange={(e) =>
                          setDraftField("unit_sell_price", e.target.value)
                        }
                        className={editInputClass}
                      />
                    </FieldRow>
                  ) : (
                    <div className="border-b border-black/10 py-2.5">
                      <p className={labelClass}>Unit cost</p>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={draft.unit_cost}
                        onChange={(e) => setDraftField("unit_cost", e.target.value)}
                        className={editInputClass}
                      />
                      <p className="mt-1 text-[10px] font-medium leading-snug text-nv-ink/55">
                        Receiving a vendor lot overwrites this with total paid ÷
                        qty.
                      </p>
                    </div>
                  )}
                  <FieldRow label="Status">
                    <select
                      value={draft.active ? "active" : "inactive"}
                      onChange={(e) =>
                        setDraftField("active", e.target.value === "active")
                      }
                      className={`${editInputClass} cursor-pointer`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </FieldRow>
                </div>

                <div className="grid gap-x-6 border-t border-black/10 pt-1 sm:grid-cols-2">
                  <FieldRow label="Created" value={formatDate(item.created_at)} />
                  <FieldRow label="Updated" value={formatDate(item.updated_at)} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
