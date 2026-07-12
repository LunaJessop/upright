"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeleteItem, GetAllItems, GetItemById, UpdateItem } from "@/app/api/apiHandler";
import BrutalSwitch from "@/components/BrutalSwitch";
import BomRecipeEditor from "@/components/BomRecipeEditor";
import BomTreeView from "@/components/BomTreeView";
import UnitOfMeasureSelect from "@/components/UnitOfMeasureSelect";

const brutalChrome = "border-brutal border-black shadow-brutal";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

/* Placeholder vendor ids — swap for a vendors table lookup later */
const VENDOR_ID_OPTIONS = Array.from({ length: 10 }, (_, index) => ({
  value: String(index + 1),
  label: `Vendor ${index + 1}`,
}));

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
  }));
}

export default function ItemDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [catalogItems, setCatalogItems] = useState([]);
  const [bomLines, setBomLines] = useState([]);
  const [bomSelectedIds, setBomSelectedIds] = useState([]);
  const bomLineIdRef = useRef(1);

  const setDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const startEditing = () => {
    setDraft(itemToDraft(item));
    setBomLines(itemToBomLines(item, bomLineIdRef.current));
    bomLineIdRef.current += (item.bom_items?.length ?? 0) + 1;
    setBomSelectedIds([]);
    setSaveError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
    setBomLines([]);
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
      return { id: lineId, itemId, quantity: "1" };
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
            }))
          : [],
      };
      const updated = await UpdateItem(id, payload);
      setItem(updated && updated.id ? updated : payload);
      setEditing(false);
      setDraft(null);
      setBomLines([]);
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
                  ) : (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="border-brutal border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5"
                    >
                      Edit
                    </button>
                  )
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
                        setValue={(value) =>
                          setDraft((prev) => ({
                            ...prev,
                            make_or_buy: value,
                            sku: value === "make" ? "" : prev.sku,
                            vendor: value === "make" ? "" : prev.vendor,
                          }))
                        }
                        offValue="buy"
                        onValue="make"
                        offLabel="Buy"
                        onLabel="Make"
                      />
                    </FieldRow>

                    {draft.make_or_buy === "buy" && (
                      <FieldRow label="Vendor">
                        <select
                          value={draft.vendor}
                          onChange={(e) => setDraftField("vendor", e.target.value)}
                          className={`${editInputClass} cursor-pointer`}
                        >
                          <option value="">—</option>
                          {VENDOR_ID_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
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
                        value={item.vendor == null ? "—" : `Vendor ${item.vendor}`}
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

              <SectionCard title="Costing" accent="bg-nv-lavender">
                <FieldRow
                  label="Cost basis"
                  value={
                    item.unit_of_measure ? `per ${item.unit_of_measure}` : "per unit"
                  }
                />
                <FieldRow label="Source" value={isMake ? "Built from BOM" : "Purchased"} />
                <p className="mt-4 text-[10px] font-medium text-nv-ink/50">
                  Rolled-up BOM and labor costing will appear here once batches and
                  BOMs are wired up.
                </p>
              </SectionCard>

              <SectionCard title="SKUs" accent="bg-nv-lavender">
                {lotSkus.length > 0 ? (
                  <ul className="space-y-2">
                    {lotSkus.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 border-brutal border-black bg-nv-lavender/20 px-3 py-2"
                      >
                        <span className="font-mono text-sm font-black">{row.sku}</span>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-nv-ink/60">
                          <span>{formatSkuSource(row.source)}</span>
                          {row.batch_id != null && (
                            <span>Batch #{row.batch_id}</span>
                          )}
                          <span>{formatDate(row.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-medium text-nv-ink/55">
                    No lot SKUs yet. Lot SKUs are created when buy stock is received
                    or when a make batch is completed.
                  </p>
                )}
              </SectionCard>

              <SectionCard title="BOM" accent="bg-nv-teal">
                {isMake ? (
                  Array.isArray(item.bom_items) && item.bom_items.length > 0 ? (
                    <>
                      <p className="mb-3 text-[10px] font-medium text-nv-ink/55">
                        Expand components with a recipe to see nested materials
                        needed per finished item.
                      </p>
                      <BomTreeView lines={item.bom_items} itemById={itemById} />
                    </>
                  ) : (
                    <p className="text-xs font-medium text-nv-ink/55">
                      No recipe defined yet. Use Edit in Item data to add
                      components.
                    </p>
                  )
                ) : (
                  <p className="text-xs font-medium text-nv-ink/55">
                    This is a Buy item — it has no BOM. Switch it to Make in
                    Item data to define a recipe.
                  </p>
                )}
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
