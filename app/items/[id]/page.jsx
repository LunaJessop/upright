"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import {
  GetAllItems,
  GetItemById,
  GetRouterPhaseTemplates,
  GetRouters,
  GetTags,
  GetVendors,
} from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_RANK } from "@/lib/auth";
import { brutalChrome, listClass, rowStripe } from "@/lib/chrome";
import { isMakeItem as isMakeFlag } from "@/lib/pricing";
import BatchesSection, { useBatches } from "./components/BatchesSection";
import BomSection from "./components/BomSection";
import EditItemModal, { useItemEditor } from "./components/EditItemModal";
import InventorySection, {
  useInventorySection,
} from "./components/InventorySection";
import { SectionCard } from "./components/ItemDetailChrome";
import ItemDetailHeader from "./components/ItemDetailHeader";
import ProductionPhasesSection from "./components/ProductionPhasesSection";
import VendorLotsSection, { useVendorLots } from "./components/VendorLotsSection";

export default function ItemDetailPage({ params }) {
  const { id } = use(params);
  const { user, canWrite } = useAuth();
  const canEditGoals =
    canWrite && (ROLE_RANK[user?.role] ?? 0) >= ROLE_RANK.admin;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalogItems, setCatalogItems] = useState([]);
  const [phaseTemplates, setPhaseTemplates] = useState([]);
  const [routers, setRouters] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [tagCatalog, setTagCatalog] = useState([]);
  const openedFromQuery = useRef(false);
  const startEditingRef = useRef(() => {});
  const loadKey = `${id}:${canWrite ? "1" : "0"}`;
  const [seenLoadKey, setSeenLoadKey] = useState(loadKey);
  if (seenLoadKey !== loadKey) {
    setSeenLoadKey(loadKey);
    setLoading(true);
    setError("");
  }

  useEffect(() => {
    openedFromQuery.current = false;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        const templates = await GetRouterPhaseTemplates().catch(() => []);
        const routerRows = await GetRouters().catch(() => []);
        const vendorRows = await GetVendors().catch(() => []);
        const tagRows = await GetTags().catch(() => []);
        if (cancelled) return;
        setCatalogItems(
          allItems.filter((entry) => String(entry.id) !== String(id))
        );
        setPhaseTemplates(Array.isArray(templates) ? templates : []);
        setRouters(Array.isArray(routerRows) ? routerRows : []);
        setVendors(Array.isArray(vendorRows) ? vendorRows : []);
        setTagCatalog(Array.isArray(tagRows) ? tagRows : []);
        // Fallback while the server lacks GET /api/items/:id
        if (!row || row.error || !row.id) {
          row = allItems.find((entry) => String(entry.id) === String(id));
        }
        if (!row) {
          setError("Item not found.");
          setItem(null);
        } else {
          setItem(row);
          if (
            canWrite &&
            !openedFromQuery.current &&
            typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("edit") === "1"
          ) {
            openedFromQuery.current = true;
            startEditingRef.current(row);
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load item.");
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, canWrite]);

  const inventory = useInventorySection({
    id,
    itemId: item?.id,
    canEditGoals,
  });
  const lots = useVendorLots({
    id,
    item,
    setItem,
    reloadInventory: inventory.loadInventory,
  });
  const batches = useBatches({ id, setItem });
  const editor = useItemEditor({
    id,
    item,
    setItem,
    setPhaseTemplates,
    setTagCatalog,
    catalogItems,
    phaseTemplates,
    reloadInventory: inventory.loadInventory,
    reloadPurchaseLots: lots.loadPurchaseLots,
  });
  useEffect(() => {
    startEditingRef.current = editor.startEditing;
  }, [editor.startEditing]);

  const isMake = isMakeFlag(item?.make_or_buy);
  const itemById = useMemo(() => {
    const map = new Map();
    if (item) map.set(String(item.id), item);
    for (const entry of catalogItems) {
      map.set(String(entry.id), entry);
    }
    return map;
  }, [item, catalogItems]);

  return (
    <div className="min-h-full min-w-0 max-w-full bg-nv-canvas px-4 py-6 text-nv-ink">
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
            <ItemDetailHeader
              item={item}
              canWrite={canWrite}
              setItem={setItem}
              onEdit={() => editor.startEditing()}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <InventorySection
                canWrite={canWrite}
                canEditGoals={canEditGoals}
                model={inventory}
              />

              {isMake ? (
                <BatchesSection
                  item={item}
                  itemById={itemById}
                  canWrite={canWrite}
                  editing={editor.editing}
                  isMake={isMake}
                  model={batches}
                />
              ) : (
                <VendorLotsSection
                  item={item}
                  canWrite={canWrite}
                  editing={editor.editing}
                  model={lots}
                />
              )}

              {isMake && (
                <BomSection
                  item={item}
                  itemById={itemById}
                  canWrite={canWrite}
                  onStartEdit={() => editor.startEditing()}
                />
              )}

              <SectionCard title="Used In" accent="bg-nv-purple-dark">
                {Array.isArray(item.used_in) && item.used_in.length > 0 ? (
                  <ul className={`${listClass} -mx-4 -mb-4`}>
                    {item.used_in.map((parent, index) => (
                      <li key={parent.id} className={rowStripe(index, "lavender")}>
                        <Link
                          href={`/items/${parent.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-nv-violet/20"
                        >
                          <span className="min-w-0 break-words">{parent.name}</span>
                          {parent.sku ? (
                            <span className="max-w-[50%] shrink-0 truncate font-mono text-[10px] font-bold uppercase tracking-wide text-nv-ink/45">
                              {parent.sku}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs font-medium text-nv-ink/55">
                    Not used in any other item’s BOM.
                  </p>
                )}
              </SectionCard>

              {isMake && (
                <ProductionPhasesSection
                  item={item}
                  itemById={itemById}
                  canWrite={canWrite}
                  onStartEdit={(focus) => editor.startEditing(undefined, focus)}
                  onPhaseRevealed={editor.notePhaseRevealed}
                />
              )}
            </div>

            <EditItemModal
              editor={editor}
              item={item}
              catalogItems={catalogItems}
              phaseTemplates={phaseTemplates}
              vendors={vendors}
              routers={routers}
              tagCatalog={tagCatalog}
              setTagCatalog={setTagCatalog}
              setItem={setItem}
            />
          </>
        )}
      </div>
    </div>
  );
}
