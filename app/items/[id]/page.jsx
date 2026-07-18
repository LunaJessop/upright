"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DeleteItem,
  GetAllItems,
  GetItemById,
  GetItemInventory,
  GetRouterPhaseTemplates,
  GetVendors,
  UpdateItem,
  UpdateItemInventory,
  UpdateItemInventoryGoal,
  CreateBatch,
} from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import BrutalSwitch from "@/components/BrutalSwitch";
import BomRecipeEditor from "@/components/BomRecipeEditor";
import BomTreeView from "@/components/BomTreeView";
import InventoryRangeBar from "@/components/InventoryRangeBar";
import NestedProductionPhases from "@/components/NestedProductionPhases";
import RouterPhaseEditor from "@/components/RouterPhaseEditor";
import UnitOfMeasureSelect from "@/components/UnitOfMeasureSelect";
import { ROLE_RANK } from "@/lib/auth";

const brutalChrome = "border-brutal border-black shadow-brutal";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

function formatCost(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value ?? "—";
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const editInputClass =
  "w-full border-brutal border-black bg-nv-paper px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

function FieldRow({ label, value, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/10 py-2.5 last:border-b-0">
      <span className={`shrink-0 ${labelClass}`}>{label}</span>
      {children ?? (
        <span className="min-w-0 flex-1 text-right text-sm font-semibold">
          {value === "" || value === null || value === undefined ? "—" : value}
        </span>
      )}
    </div>
  );
}

function FieldBlock({ label, value, children }) {
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

function SectionCard({ title, accent = "bg-nv-cyan", action, children, className = "" }) {
  return (
    <section className={`${brutalChrome} bg-nv-paper ${className}`}>
      <header
        className={`flex items-center justify-between gap-2 border-b-brutal border-black ${accent} px-4 py-2`}
      >
        <h2 className="text-sm font-black uppercase tracking-wide text-black">
          {title}
        </h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function formatSkuSource(source) {
  if (source === "purchase") return "Purchase";
  if (source === "production") return "Production";
  return "—";
}

function itemToDraft(item) {
  const isMake =
    item.make_or_buy === "make" || item.make_or_buy === true || item.make_or_buy === "true";
  return {
    name: item.name == null ? "" : String(item.name),
    sku: item.sku == null ? "" : String(item.sku),
    description: item.description == null ? "" : String(item.description),
    make_or_buy: isMake ? "make" : "buy",
    unit_of_measure: item.unit_of_measure ?? "",
    default_unit_price: item.default_unit_price == null ? "" : String(item.default_unit_price),
    vendor: item.vendor == null ? "" : String(item.vendor),
    active: Boolean(item.active),
  };
}

function itemToBomLines(item, startId) {
  if (!Array.isArray(item.bom_items)) return [];
  return item.bom_items.map((line, index) => ({
    id: startId + index,
    itemId: String(line.component_item_id),
    quantity: String(line.quantity ?? "1"),
    unitOfMeasure: line.unit_of_measure ?? "",
  }));
}

function itemToRouterPhases(item, startId) {
  if (!Array.isArray(item.router_phases)) return [];
  return item.router_phases.map((phase, index) => ({
    id: startId + index,
    sequence: phase.sequence ?? index + 1,
    name: phase.name == null ? "" : String(phase.name),
    description: phase.description == null ? "" : String(phase.description),
    estimated_minutes:
      phase.estimated_minutes == null ? "" : String(phase.estimated_minutes),
  }));
}

function routerPhasesToPayload(phases) {
  return phases.map((phase, index) => ({
    sequence: index + 1,
    name: phase.name.trim(),
    description: phase.description.trim(),
    estimated_minutes:
      phase.estimated_minutes.trim() === "" ? null : phase.estimated_minutes.trim(),
  }));
}

function formatQty(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value ?? "—";
  return Number.isInteger(number)
    ? String(number)
    : number.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function stockStatusLabel(status) {
  if (status === "below") return "Below goal";
  if (status === "above") return "Above goal";
  if (status === "on_track") return "On track";
  return null;
}

const STOCK_STATUS_STYLES = {
  below: "bg-red-600 text-white",
  above: "bg-nv-violet text-white",
  on_track: "bg-nv-teal text-black",
};

function formatPlannedDelta(delta, unit) {
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return "No open batch effect";
  const sign = n > 0 ? "+" : "−";
  const abs = formatQty(Math.abs(n));
  const unitSuffix = unit ? ` ${unit}` : "";
  return `After open batches (${sign}${abs}${unitSuffix})`;
}

export default function ItemDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, canWrite } = useAuth();
  const canEditGoals =
    canWrite && (ROLE_RANK[user?.role] ?? 0) >= ROLE_RANK.admin;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchQty, setBatchQty] = useState("1");
  const [batchSku, setBatchSku] = useState("");
  const [batchError, setBatchError] = useState("");
  const [catalogItems, setCatalogItems] = useState([]);
  const [phaseTemplates, setPhaseTemplates] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bomLines, setBomLines] = useState([]);
  const [bomSelectedIds, setBomSelectedIds] = useState([]);
  const [routerPhases, setRouterPhases] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryEditing, setInventoryEditing] = useState(false);
  const [inventoryDraftQty, setInventoryDraftQty] = useState("");
  const [inventoryDraftGoalMin, setInventoryDraftGoalMin] = useState("");
  const [inventoryDraftGoalMax, setInventoryDraftGoalMax] = useState("");
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const bomLineIdRef = useRef(1);
  const routerPhaseIdRef = useRef(1);

  const setDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = () => {
    setDraft(itemToDraft(item));
    setBomLines(itemToBomLines(item, bomLineIdRef.current));
    bomLineIdRef.current += (item.bom_items?.length ?? 0) + 1;
    setRouterPhases(itemToRouterPhases(item, routerPhaseIdRef.current));
    routerPhaseIdRef.current += (item.router_phases?.length ?? 0) + 1;
    setBomSelectedIds([]);
    setSaveError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    setBomLines([]);
    setRouterPhases([]);
    setBomSelectedIds([]);
    setSaveError("");
    setConfirmingDelete(false);
    setDeleting(false);
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

  const saveDraft = async () => {
    if (!draft.name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    const isMakeDraft = draft.make_or_buy === "make";
    if (!isMakeDraft && !draft.sku.trim()) {
      setSaveError("Vendor part number is required for buy items.");
      return;
    }
    if (
      isMakeDraft &&
      bomLines.some((line) => !(Number(line.quantity) > 0))
    ) {
      setSaveError("Every recipe component needs a quantity greater than zero.");
      return;
    }
    if (
      isMakeDraft &&
      routerPhases.some((phase) => !phase.name.trim())
    ) {
      setSaveError("Every router phase needs a name.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        ...item,
        ...draft,
        name: draft.name.trim(),
        sku: isMakeDraft ? null : draft.sku.trim(),
        description: draft.description.trim(),
        default_unit_price:
          draft.default_unit_price.trim() === "" ? null : draft.default_unit_price.trim(),
        vendor:
          isMakeDraft || draft.vendor === "" ? null : Number(draft.vendor),
        bom_items: isMakeDraft
          ? bomLines.map((line) => ({
              component_item_id: Number(line.itemId),
              quantity: line.quantity,
              unit_of_measure: line.unitOfMeasure || null,
            }))
          : [],
        router_phases: isMakeDraft ? routerPhasesToPayload(routerPhases) : [],
      };
      const updated = await UpdateItem(id, payload);
      setItem(updated && updated.id ? updated : payload);
      const templates = await GetRouterPhaseTemplates().catch(() => []);
      setPhaseTemplates(Array.isArray(templates) ? templates : []);
      setEditing(false);
      setDraft(null);
      setBomLines([]);
      setRouterPhases([]);
      setBomSelectedIds([]);
    } catch (err) {
      setSaveError(err?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setSaveError("");
    try {
      await DeleteItem(id);
      try {
        await router.push("/items");
      } catch {
        window.location.assign("/items");
      }
    } catch (err) {
      setSaveError(err?.message || "Failed to delete item.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  const handleCreateBatch = async () => {
    const qty = Number(batchQty);
    if (!batchSku.trim()) {
      setBatchError("SKU is required.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setBatchError("Enter a quantity greater than zero.");
      return;
    }
    setCreatingBatch(true);
    setBatchError("");
    try {
      const batch = await CreateBatch({
        item_id: Number(id),
        quantity: qty,
        sku: batchSku.trim(),
      });
      await router.push(`/batches/${batch.id}`);
    } catch (err) {
      setBatchError(err?.message || "Failed to create batch.");
      setCreatingBatch(false);
    }
  };

  const loadItem = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let row;
      try {
        row = await GetItemById(id);
      } catch {
        row = undefined;
      }
      // Catalog is used for BOM display names and the recipe editor
      const rows = await GetAllItems().catch(() => []);
      const allItems = Array.isArray(rows) ? rows : [];
      setCatalogItems(allItems.filter((entry) => String(entry.id) !== String(id)));
      const templates = await GetRouterPhaseTemplates().catch(() => []);
      setPhaseTemplates(Array.isArray(templates) ? templates : []);
      const vendorRows = await GetVendors().catch(() => []);
      setVendors(Array.isArray(vendorRows) ? vendorRows : []);
      // Fallback while the server lacks GET /api/items/:id
      if (!row || row.error || !row.id) {
        row = allItems.find((entry) => String(entry.id) === String(id));
      }
      if (!row) {
        setError("Item not found.");
        setItem(null);
      } else {
        setItem(row);
      }
    } catch {
      setError("Failed to load item.");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadItem();
  }, [loadItem]);

  const loadInventory = useCallback(async () => {
    if (!id) return;
    setInventoryLoading(true);
    setInventoryError("");
    try {
      const row = await GetItemInventory(id);
      setInventory(row);
    } catch (err) {
      setInventory(null);
      setInventoryError(err?.message || "Failed to load inventory.");
    } finally {
      setInventoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!item?.id) {
      setInventory(null);
      return;
    }
    void loadInventory();
  }, [item?.id, loadInventory]);

  const startInventoryEdit = () => {
    setInventoryDraftQty(
      inventory?.quantity == null ? "0" : String(inventory.quantity)
    );
    setInventoryDraftGoalMin(
      inventory?.goal_min == null ? "" : String(inventory.goal_min)
    );
    setInventoryDraftGoalMax(
      inventory?.goal_max == null ? "" : String(inventory.goal_max)
    );
    setInventoryError("");
    setInventoryEditing(true);
  };

  const cancelInventoryEdit = () => {
    setInventoryEditing(false);
    setInventoryError("");
  };

  const saveInventoryEdit = async () => {
    const qty = Number(inventoryDraftQty);
    if (!Number.isFinite(qty) || qty < 0) {
      setInventoryError("Current quantity must be a non-negative number.");
      return;
    }

    setInventorySaving(true);
    setInventoryError("");
    try {
      let next = await UpdateItemInventory(id, { quantity: qty });

      if (canEditGoals) {
        const minRaw = inventoryDraftGoalMin.trim();
        const maxRaw = inventoryDraftGoalMax.trim();
        if (minRaw !== "" || maxRaw !== "") {
          const goalMin = Number(minRaw);
          const goalMax = Number(maxRaw);
          if (!Number.isFinite(goalMin) || goalMin < 0) {
            setInventoryError("Goal min must be a non-negative number.");
            setInventorySaving(false);
            return;
          }
          if (!Number.isFinite(goalMax) || goalMax < goalMin) {
            setInventoryError("Goal max must be ≥ goal min.");
            setInventorySaving(false);
            return;
          }
          next = await UpdateItemInventoryGoal(id, {
            goal_min: goalMin,
            goal_max: goalMax,
          });
        }
      }

      setInventory(next);
      setInventoryEditing(false);
    } catch (err) {
      setInventoryError(err?.message || "Failed to save inventory.");
    } finally {
      setInventorySaving(false);
    }
  };

  const isMake =
    item?.make_or_buy === "make" || item?.make_or_buy === true || item?.make_or_buy === "true";
  const lotSkus = Array.isArray(item?.item_skus) ? item.item_skus : [];
  const headerLabel = isMake
    ? lotSkus[0]?.sku ?? "No lot SKUs yet"
    : item?.sku || "No vendor part #";

  const itemById = useMemo(() => {
    const map = new Map();
    if (item) map.set(String(item.id), item);
    for (const entry of catalogItems) {
      map.set(String(entry.id), entry);
    }
    return map;
  }, [item, catalogItems]);

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/items"
          className="mb-4 inline-block border-brutal border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          ← All items
        </Link>

        {loading && (
          <p className="text-xs font-medium text-nv-ink/55">Loading item…</p>
        )}

        {!loading && error && (
          <div className={`${brutalChrome} bg-nv-paper p-6`}>
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && item && (
          <>
            <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
                {headerLabel}
              </p>
              <h1 className="text-3xl font-black uppercase leading-tight">
                {item.name}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="border-brutal border-black bg-nv-cyan px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
                  {isMake ? "Make" : "Buy"}
                </span>
                <span
                  className={`border-brutal border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    item.active ? "bg-nv-cyan text-black" : "bg-black/20 text-white"
                  }`}
                >
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard
                title="Item data"
                action={
                  editing ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {confirmingDelete ? (
                        <>
                          <span className="text-[10px] font-bold uppercase tracking-wide text-black">
                            Delete &quot;{item.name}&quot;?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmingDelete(false);
                              setSaveError("");
                            }}
                            disabled={deleting}
                            className="border-brutal border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete()}
                            disabled={deleting}
                            className="border-brutal border-black bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
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
                            className="border-brutal border-black bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={saving || deleting}
                            className="border-brutal border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => void saveDraft()}
                            disabled={saving || deleting}
                            className="border-brutal border-black bg-nv-violet px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                        </>
                      )}
                      {saveError && (
                        <p className="w-full text-right text-[10px] font-bold uppercase tracking-wide text-red-700">
                          {saveError}
                        </p>
                      )}
                    </div>
                  ) : canWrite ? (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="border-brutal border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
                    >
                      Edit
                    </button>
                  ) : null
                }
              >
                {editing && draft ? (
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
                      {draft.make_or_buy === "buy" && (
                        <FieldRow label="Vendor part #">
                          <input
                            type="text"
                            value={draft.sku}
                            onChange={(e) => setDraftField("sku", e.target.value)}
                            className={editInputClass}
                            placeholder="Supplier catalog number"
                          />
                        </FieldRow>
                      )}
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

                    <FieldRow label="Make or buy">
                      <BrutalSwitch
                        ariaLabel="Make or buy"
                        value={draft.make_or_buy}
                        setValue={(value) => {
                          setDraft((prev) => ({
                            ...prev,
                            make_or_buy: value,
                            sku: value === "make" ? "" : prev.sku,
                            vendor: value === "make" ? "" : prev.vendor,
                          }));
                          if (value === "buy") {
                            setRouterPhases([]);
                            setBomLines([]);
                            setBomSelectedIds([]);
                          }
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
                          onAddFromTemplate={addRouterPhaseFromTemplate}
                          onRemovePhase={removeRouterPhase}
                          onMoveUp={(phaseId) => moveRouterPhase(phaseId, "up")}
                          onMoveDown={(phaseId) => moveRouterPhase(phaseId, "down")}
                          onReorderPhases={setRouterPhases}
                        />
                      </div>
                    )}

                    {draft.make_or_buy === "buy" && (
                      <FieldRow label="Vendor">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={draft.vendor}
                              onChange={(e) =>
                                setDraftField("vendor", e.target.value)
                              }
                              className={`${editInputClass} cursor-pointer`}
                            >
                              <option value="">—</option>
                              {vendors.map((vendor) => (
                                <option key={vendor.id} value={String(vendor.id)}>
                                  {vendor.name}
                                </option>
                              ))}
                            </select>
                            <Link
                              href="/settings/vendors"
                              aria-label="Add vendor"
                              title="Add vendor"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center border-brutal border-black bg-nv-cyan text-sm font-black leading-none transition-transform hover:-translate-y-0.5"
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
                      <div className="border-b border-black/10 py-3">
                        <BomRecipeEditor
                          catalogItems={catalogItems}
                          bomLines={bomLines}
                          selectedItemIds={bomSelectedIds}
                          onSelectedItemIdsChange={setBomSelectedIds}
                          onAddSelected={addSelectedBomLines}
                          onRemoveLine={removeBomLine}
                          onUpdateLineQuantity={updateBomLineQuantity}
                          onUpdateLineUnit={updateBomLineUnit}
                          parentUnitOfMeasure={draft.unit_of_measure}
                        />
                      </div>
                    )}

                    <div className="grid gap-x-6 sm:grid-cols-2">
                      <FieldRow label="Unit of measure">
                        <UnitOfMeasureSelect
                          value={draft.unit_of_measure}
                          onChange={(e) => setDraftField("unit_of_measure", e.target.value)}
                          className={`${editInputClass} cursor-pointer`}
                        />
                      </FieldRow>
                      <FieldRow label="List price">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={draft.default_unit_price}
                          onChange={(e) => setDraftField("default_unit_price", e.target.value)}
                          className={editInputClass}
                        />
                      </FieldRow>
                      <FieldRow label="Status">
                        <select
                          value={draft.active ? "active" : "inactive"}
                          onChange={(e) => setDraftField("active", e.target.value === "active")}
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
                ) : (
                  <div className="space-y-1">
                    <FieldRow label="Name" value={item.name} />
                    {!isMake && (
                      <FieldRow label="Vendor part #" value={item.sku} />
                    )}

                    <FieldBlock label="Description" value={item.description} />

                    <FieldRow label="Make or buy" value={isMake ? "Make" : "Buy"} />

                    {!isMake && (
                      <FieldRow
                        label="Vendor"
                        value={
                          item.vendor_name ||
                          (item.vendor == null ? "—" : `Vendor #${item.vendor}`)
                        }
                      />
                    )}

                    <div className="grid gap-x-6 sm:grid-cols-2">
                      <FieldRow label="Unit of measure" value={item.unit_of_measure} />
                      <FieldRow label="List price" value={formatCost(item.default_unit_price)} />
                      <FieldRow label="Status" value={item.active ? "Active" : "Inactive"} />
                    </div>

                    <div className="grid gap-x-6 border-t border-black/10 pt-1 sm:grid-cols-2">
                      <FieldRow label="Created" value={formatDate(item.created_at)} />
                      <FieldRow label="Updated" value={formatDate(item.updated_at)} />
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Inventory"
                accent="bg-nv-lavender"
                action={
                  inventoryEditing ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelInventoryEdit}
                        disabled={inventorySaving}
                        className="border-brutal border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveInventoryEdit()}
                        disabled={inventorySaving}
                        className="border-brutal border-black bg-nv-violet px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                      >
                        {inventorySaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  ) : canWrite ? (
                    <button
                      type="button"
                      onClick={startInventoryEdit}
                      disabled={inventoryLoading || !inventory}
                      className="border-brutal border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
                    >
                      Edit
                    </button>
                  ) : null
                }
              >
                {inventoryLoading && (
                  <p className="text-xs font-medium text-nv-ink/55">
                    Loading inventory…
                  </p>
                )}

                {!inventoryLoading && inventoryError && !inventoryEditing && (
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                    {inventoryError}
                  </p>
                )}

                {!inventoryLoading && inventory && (
                  <>
                    {inventoryEditing ? (
                      <div className="space-y-3">
                        <label className="block space-y-1">
                          <span className={labelClass}>Current QTY</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={inventoryDraftQty}
                            onChange={(e) =>
                              setInventoryDraftQty(e.target.value)
                            }
                            className={editInputClass}
                          />
                        </label>
                        {canEditGoals ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block space-y-1">
                              <span className={labelClass}>
                                Min
                                {inventory.unit_of_measure
                                  ? ` ${inventory.unit_of_measure}`
                                  : ""}
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={inventoryDraftGoalMin}
                                onChange={(e) =>
                                  setInventoryDraftGoalMin(e.target.value)
                                }
                                className={editInputClass}
                                placeholder="Optional"
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className={labelClass}>
                                Max
                                {inventory.unit_of_measure
                                  ? ` ${inventory.unit_of_measure}`
                                  : ""}
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={inventoryDraftGoalMax}
                                onChange={(e) =>
                                  setInventoryDraftGoalMax(e.target.value)
                                }
                                className={editInputClass}
                                placeholder="Optional"
                              />
                            </label>
                          </div>
                        ) : (
                          <p className="text-[10px] font-medium text-nv-ink/55">
                            Goal range can be set by admins and founders.
                          </p>
                        )}
                        {inventoryError && (
                          <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                            {inventoryError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4 border-b border-black/10 py-2.5">
                          <span className={`shrink-0 ${labelClass}`}>
                            Current QTY
                          </span>
                          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                            <span className="text-sm font-semibold">
                              {formatQty(inventory.quantity)}
                              {inventory.unit_of_measure
                                ? ` ${inventory.unit_of_measure}`
                                : ""}
                            </span>
                            {stockStatusLabel(inventory.status) && (
                              <span
                                className={`border border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                                  STOCK_STATUS_STYLES[inventory.status] ??
                                  "bg-nv-paper"
                                }`}
                              >
                                {stockStatusLabel(inventory.status)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="border-b border-black/10 py-2.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className={`shrink-0 ${labelClass}`}>
                              Planned QTY
                            </span>
                            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                              <span className="text-sm font-semibold">
                                {formatQty(inventory.planned_quantity)}
                                {inventory.unit_of_measure
                                  ? ` ${inventory.unit_of_measure}`
                                  : ""}
                              </span>
                              {stockStatusLabel(inventory.planned_status) && (
                                <span
                                  className={`border border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                                    STOCK_STATUS_STYLES[
                                      inventory.planned_status
                                    ] ?? "bg-nv-paper"
                                  }`}
                                >
                                  {stockStatusLabel(inventory.planned_status)}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-right text-[10px] font-medium text-nv-ink/55">
                            {formatPlannedDelta(
                              inventory.planned_delta,
                              inventory.unit_of_measure
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 py-2.5">
                          <span className={labelClass}>Goal</span>
                          <span className="text-sm font-semibold">
                            {inventory.goal_min != null &&
                            inventory.goal_max != null
                              ? `${formatQty(inventory.goal_min)} – ${formatQty(inventory.goal_max)}${
                                  inventory.unit_of_measure
                                    ? ` ${inventory.unit_of_measure}`
                                    : ""
                                }`
                              : "Not set"}
                          </span>
                        </div>
                        <InventoryRangeBar
                          quantity={inventory.quantity}
                          plannedQuantity={inventory.planned_quantity}
                          goalMin={inventory.goal_min}
                          goalMax={inventory.goal_max}
                          unit={inventory.unit_of_measure ?? ""}
                        />
                      </div>
                    )}
                  </>
                )}
              </SectionCard>

              {isMake && (
                <SectionCard title="Batches" accent="bg-nv-lavender">
                  {!editing && canWrite && (
                    <div className="mb-4 space-y-2 border-b border-black/10 pb-4">
                      <p className="text-[10px] font-black uppercase tracking-wide">
                        New batch
                      </p>
                      {batchError && (
                        <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                          {batchError}
                        </p>
                      )}
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="min-w-32 flex-1 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                            SKU
                          </span>
                          <input
                            type="text"
                            value={batchSku}
                            onChange={(e) => setBatchSku(e.target.value)}
                            placeholder="Lot / batch number"
                            className="w-full border-brutal border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
                          />
                        </label>
                        <label className="w-20 space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                            Qty
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={batchQty}
                            onChange={(e) => setBatchQty(e.target.value)}
                            className="w-full border-brutal border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void handleCreateBatch()}
                          disabled={creatingBatch}
                          className="border-brutal border-black bg-nv-violet px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                        >
                          {creatingBatch ? "Creating…" : "Create batch"}
                        </button>
                      </div>
                    </div>
                  )}

                  {lotSkus.length > 0 ? (
                    <ul className="space-y-2">
                      {lotSkus.map((row) => {
                        const content = (
                          <>
                            <span className="font-mono text-sm font-black">{row.sku}</span>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-nv-ink/60">
                              <span>{formatSkuSource(row.source)}</span>
                              {row.batch_id != null && (
                                <span>Batch #{row.batch_id}</span>
                              )}
                              <span>{formatDate(row.created_at)}</span>
                            </div>
                          </>
                        );
                        const rowClass =
                          "flex flex-wrap items-center justify-between gap-3 border-brutal border-black bg-nv-lavender/20 px-3 py-2";

                        if (row.batch_id != null) {
                          return (
                            <li key={row.id}>
                              <Link
                                href={`/batches/${row.batch_id}`}
                                className={`${rowClass} transition-transform hover:-translate-y-0.5 hover:bg-nv-lavender/40`}
                              >
                                {content}
                              </Link>
                            </li>
                          );
                        }

                        return (
                          <li key={row.id} className={rowClass}>
                            {content}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs font-medium text-nv-ink/55">
                      No batches yet.
                    </p>
                  )}
                </SectionCard>
              )}

              {isMake && (
                <SectionCard title="BOM" accent="bg-nv-teal">
                  {Array.isArray(item.bom_items) && item.bom_items.length > 0 ? (
                    <>
                      <p className="mb-3 text-[10px] font-medium text-nv-ink/55">
                        Child items — expand make components to see nested
                        materials and their phases.
                      </p>
                      <BomTreeView lines={item.bom_items} itemById={itemById} />
                    </>
                  ) : (
                    <p className="text-xs font-medium text-nv-ink/55">
                      No recipe defined yet. Use Edit in Item data to add
                      components.
                    </p>
                  )}
                </SectionCard>
              )}

              {isMake && (
                <div className="lg:col-span-2">
                  <SectionCard title="Production phases" accent="bg-nv-violet">
                    <NestedProductionPhases
                      rootItem={item}
                      itemById={itemById}
                    />
                  </SectionCard>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
