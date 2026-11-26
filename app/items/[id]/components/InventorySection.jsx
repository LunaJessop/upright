"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GetItemInventory,
  UpdateItemInventory,
  UpdateItemInventoryGoal,
} from "@/app/api/apiHandler";
import AnimatedNumber from "@/components/AnimatedNumber";
import InventoryRangeBar from "@/components/InventoryRangeBar";
import QuantityChangeConfirm, {
  quantityChanged,
} from "@/components/QuantityChangeConfirm";
import { useToast } from "@/components/Toast";
import { mergeInventorySave, validateInventoryEdit } from "@/lib/inventoryEdit";
import { formatPlannedDelta, formatQty, stockStatusLabel } from "@/lib/itemDetail";
import { editInputClass, labelClass, SectionCard } from "./ItemDetailChrome";

const STOCK_STATUS_STYLES = {
  below: "bg-red-600",
  above: "bg-nv-purple-dark",
  on_track: "bg-nv-green-dark",
};

export function useInventorySection({ id, itemId, canEditGoals }) {
  const toast = useToast();
  const [inventory, setInventory] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryEditing, setInventoryEditing] = useState(false);
  const [inventoryDraftQty, setInventoryDraftQty] = useState("");
  const [inventoryDraftGoalMin, setInventoryDraftGoalMin] = useState("");
  const [inventoryDraftGoalMax, setInventoryDraftGoalMax] = useState("");
  const [inventorySaving, setInventorySaving] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [confirmingInventoryQty, setConfirmingInventoryQty] = useState(false);

  const loadInventory = useCallback(async () => {
    if (!id) return;
    setInventoryLoading(true);
    setInventoryError("");
    try {
      const row = await GetItemInventory(id);
      setInventory(row);
    } catch (err) {
      setInventoryError(err?.message || "Failed to load inventory.");
    } finally {
      setInventoryLoading(false);
    }
  }, [id]);

  const inventoryKey = itemId ? `${id}:${itemId}` : "";
  const [seenInventoryKey, setSeenInventoryKey] = useState(inventoryKey);
  if (seenInventoryKey !== inventoryKey) {
    setSeenInventoryKey(inventoryKey);
    setInventory(null);
    setInventoryError("");
    setInventoryLoading(Boolean(itemId));
  }

  useEffect(() => {
    if (!itemId) return undefined;
    let cancelled = false;
    GetItemInventory(id)
      .then((row) => {
        if (!cancelled) setInventory(row);
      })
      .catch((err) => {
        if (!cancelled) {
          setInventoryError(err?.message || "Failed to load inventory.");
        }
      })
      .finally(() => {
        if (!cancelled) setInventoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, id]);

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
    setConfirmingInventoryQty(false);
    setInventoryEditing(true);
  };

  const cancelInventoryEdit = () => {
    setInventoryEditing(false);
    setInventoryError("");
    setConfirmingInventoryQty(false);
  };

  const saveInventoryEdit = async (confirmed = false) => {
    const parsed = validateInventoryEdit({
      quantityRaw: inventoryDraftQty,
      goalMinRaw: inventoryDraftGoalMin,
      goalMaxRaw: inventoryDraftGoalMax,
      editGoals: canEditGoals,
    });
    if (!parsed.ok) {
      setInventoryError(parsed.error);
      setConfirmingInventoryQty(false);
      toast.error(parsed.error);
      return;
    }

    if (!confirmed && quantityChanged(inventory?.quantity, parsed.quantity)) {
      setConfirmingInventoryQty(true);
      setInventoryError("");
      return;
    }

    setConfirmingInventoryQty(false);
    setInventorySaving(true);
    setInventoryError("");
    try {
      const quantityRow = await UpdateItemInventory(id, {
        quantity: parsed.quantity,
      });
      const goalRow = parsed.goals
        ? await UpdateItemInventoryGoal(id, parsed.goals)
        : null;

      setInventory(mergeInventorySave(quantityRow, goalRow));
      setInventoryEditing(false);
      toast.success("Inventory updated.");
    } catch (err) {
      const message = err?.message || "Failed to save inventory.";
      setInventoryError(message);
      toast.error(message);
    } finally {
      setInventorySaving(false);
    }
  };

  return {
    loadInventory,
    inventory,
    inventoryLoading,
    inventoryEditing,
    inventoryDraftQty,
    setInventoryDraftQty,
    inventoryDraftGoalMin,
    setInventoryDraftGoalMin,
    inventoryDraftGoalMax,
    setInventoryDraftGoalMax,
    inventorySaving,
    inventoryError,
    confirmingInventoryQty,
    setConfirmingInventoryQty,
    startInventoryEdit,
    cancelInventoryEdit,
    saveInventoryEdit,
  };
}

export default function InventorySection({ canWrite, canEditGoals, model }) {
  const {
    inventory,
    inventoryLoading,
    inventoryEditing,
    inventoryDraftQty,
    setInventoryDraftQty,
    inventoryDraftGoalMin,
    setInventoryDraftGoalMin,
    inventoryDraftGoalMax,
    setInventoryDraftGoalMax,
    inventorySaving,
    inventoryError,
    confirmingInventoryQty,
    setConfirmingInventoryQty,
    startInventoryEdit,
    cancelInventoryEdit,
    saveInventoryEdit,
  } = model;

  return (
    <SectionCard
      title="Inventory"
      accent="bg-nv-purple-dark"
      action={
        inventoryEditing ? (
          confirmingInventoryQty ? null : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelInventoryEdit}
                disabled={inventorySaving}
                className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveInventoryEdit(false)}
                disabled={inventorySaving}
                className="border-brutal-xs border-black bg-nv-violet px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
              >
                {inventorySaving ? "Saving…" : "Save"}
              </button>
            </div>
          )
        ) : canWrite ? (
          <button
            type="button"
            onClick={startInventoryEdit}
            disabled={!inventory}
            className="border-brutal-xs border-black bg-nv-green-tint px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
          >
            Edit
          </button>
        ) : null
      }
    >
      {inventoryLoading && !inventory && (
        <p className="text-xs font-medium text-nv-ink/55">Loading inventory…</p>
      )}

      {inventoryError && !inventoryEditing && !inventory && (
        <p className="text-xs font-bold uppercase tracking-wide text-red-600">
          {inventoryError}
        </p>
      )}

      {inventoryError && !inventoryEditing && inventory && (
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-red-600">
          {inventoryError}
        </p>
      )}

      {inventory && (
        <>
          {inventoryEditing ? (
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className={labelClass}>Current QTY</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={inventoryDraftQty}
                  onChange={(e) => {
                    setInventoryDraftQty(e.target.value);
                    setConfirmingInventoryQty(false);
                  }}
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
                      onChange={(e) => setInventoryDraftGoalMin(e.target.value)}
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
                      onChange={(e) => setInventoryDraftGoalMax(e.target.value)}
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
              {confirmingInventoryQty && (
                <QuantityChangeConfirm
                  oldQuantity={inventory.quantity}
                  newQuantity={inventoryDraftQty}
                  unit={inventory.unit_of_measure ?? ""}
                  saving={inventorySaving}
                  onCancel={() => setConfirmingInventoryQty(false)}
                  onConfirm={() => void saveInventoryEdit(true)}
                />
              )}
            </div>
          ) : (
            <div
              className={`space-y-3 transition-opacity duration-200 ${
                inventoryLoading ? "opacity-70" : "opacity-100"
              }`}
            >
              <div className="flex items-center justify-between gap-4 border-b border-black/10 py-2.5">
                <span className={`shrink-0 ${labelClass}`}>Current QTY</span>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    <AnimatedNumber value={inventory.quantity} format={formatQty} />
                    {inventory.unit_of_measure
                      ? ` ${inventory.unit_of_measure}`
                      : ""}
                  </span>
                  {stockStatusLabel(inventory.status) && (
                    <span
                      className={`border border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                        STOCK_STATUS_STYLES[inventory.status] ?? "bg-nv-paper"
                      }`}
                    >
                      {stockStatusLabel(inventory.status)}
                    </span>
                  )}
                </div>
              </div>
              <div className="border-b border-black/10 py-2.5">
                <div className="flex items-center justify-between gap-4">
                  <span className={`shrink-0 ${labelClass}`}>Planned QTY</span>
                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                    <span className="text-sm font-semibold tabular-nums">
                      <AnimatedNumber
                        value={inventory.planned_quantity}
                        format={formatQty}
                      />
                      {inventory.unit_of_measure
                        ? ` ${inventory.unit_of_measure}`
                        : ""}
                    </span>
                    {stockStatusLabel(inventory.planned_status) && (
                      <span
                        className={`border border-black px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          STOCK_STATUS_STYLES[inventory.planned_status] ??
                          "bg-nv-paper"
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
                  {inventory.goal_min != null && inventory.goal_max != null
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
  );
}
