"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CreateItemInventoryTransaction,
  GetItemInventory,
  GetItemInventoryTransactions,
  UpdateItemInventory,
  UpdateItemInventoryGoal,
} from "@/app/api/apiHandler";
import AnimatedNumber from "@/components/AnimatedNumber";
import { InventoryBodySkeleton } from "@/components/Skeleton";
import InventoryRangeBar from "@/components/InventoryRangeBar";
import QuantityChangeConfirm, {
  quantityChanged,
} from "@/components/QuantityChangeConfirm";
import { useToast } from "@/components/Toast";
import { mergeInventorySave, validateInventoryEdit } from "@/lib/inventoryEdit";
import { formatPlannedDelta, formatQty, stockStatusLabel } from "@/lib/itemDetail";
import {
  TRANSACTION_PAGE_LIMIT,
  emptyTransactionDraft,
  formatOnHandAfter,
  mergeTransactionPages,
  prepareManualTransaction,
  projectOnHand,
} from "@/lib/inventoryTransaction";
import HelpIcon from "@/components/HelpIcon";
import { HELP_LABELS, HELP_TEXT } from "@/lib/helpText";
import { editInputClass, labelClass, SectionCard } from "./ItemDetailChrome";
import {
  InventoryCardActions,
  InventoryTransactionList,
  InventoryTransactionModal,
} from "./InventoryTransactions";

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
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(Boolean(itemId));
  const [transactionsLoadingMore, setTransactionsLoadingMore] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");
  const [transactionsHasMore, setTransactionsHasMore] = useState(false);
  const [transactionsNextBefore, setTransactionsNextBefore] = useState(null);
  const [transactionSaving, setTransactionSaving] = useState(false);
  const historyRequest = useRef(0);
  const activeItemId = useRef(id);

  const applyTransactionPage = useCallback((page, { append }) => {
    const rows = Array.isArray(page?.transactions) ? page.transactions : [];
    setTransactions((current) => (append ? mergeTransactionPages(current, rows) : rows));
    setTransactionsHasMore(Boolean(page?.has_more));
    setTransactionsNextBefore(page?.next_before ?? null);
  }, []);

  const refreshTransactions = useCallback(async () => {
    if (!id) return;
    const token = ++historyRequest.current;
    setTransactionsLoading(true);
    setTransactionsError("");
    try {
      const page = await GetItemInventoryTransactions(id, {
        limit: TRANSACTION_PAGE_LIMIT,
      });
      if (token !== historyRequest.current) return;
      applyTransactionPage(page, { append: false });
    } catch (err) {
      if (token !== historyRequest.current) return;
      setTransactionsError(err?.message || "Failed to load stock history.");
    } finally {
      if (token === historyRequest.current) setTransactionsLoading(false);
    }
  }, [id, applyTransactionPage]);

  const loadMoreTransactions = useCallback(async () => {
    if (!id || transactionsNextBefore == null || transactionsLoadingMore || transactionsLoading) {
      return;
    }
    const token = historyRequest.current;
    setTransactionsLoadingMore(true);
    setTransactionsError("");
    try {
      const page = await GetItemInventoryTransactions(id, {
        limit: TRANSACTION_PAGE_LIMIT,
        before: transactionsNextBefore,
      });
      if (token !== historyRequest.current) return;
      applyTransactionPage(page, { append: true });
    } catch (err) {
      if (token !== historyRequest.current) return;
      setTransactionsError(err?.message || "Failed to load stock history.");
    } finally {
      if (token === historyRequest.current) setTransactionsLoadingMore(false);
    }
  }, [id, transactionsNextBefore, transactionsLoadingMore, transactionsLoading, applyTransactionPage]);

  const loadInventory = useCallback(async () => {
    if (!id) return;
    setInventoryLoading(true);
    setInventoryError("");
    const historyPromise = refreshTransactions();
    try {
      const row = await GetItemInventory(id);
      setInventory(row);
    } catch (err) {
      setInventoryError(err?.message || "Failed to load inventory.");
    } finally {
      setInventoryLoading(false);
    }
    await historyPromise;
  }, [id, refreshTransactions]);

  const inventoryKey = itemId ? `${id}:${itemId}` : "";
  const [seenInventoryKey, setSeenInventoryKey] = useState(inventoryKey);
  if (seenInventoryKey !== inventoryKey) {
    setSeenInventoryKey(inventoryKey);
    setInventory(null);
    setInventoryError("");
    setInventoryLoading(Boolean(itemId));
    setTransactions([]);
    setTransactionsError("");
    setTransactionsHasMore(false);
    setTransactionsNextBefore(null);
    setTransactionsLoading(Boolean(itemId));
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

  useEffect(() => {
    activeItemId.current = id;
  }, [id]);

  useEffect(() => {
    if (!itemId) return undefined;
    let cancelled = false;
    const token = ++historyRequest.current;
    GetItemInventoryTransactions(id, { limit: TRANSACTION_PAGE_LIMIT })
      .then((page) => {
        if (cancelled || token !== historyRequest.current) return;
        applyTransactionPage(page, { append: false });
      })
      .catch((err) => {
        if (cancelled || token !== historyRequest.current) return;
        setTransactionsError(err?.message || "Failed to load stock history.");
      })
      .finally(() => {
        if (!cancelled && token === historyRequest.current) setTransactionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, id, applyTransactionPage]);

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
      await refreshTransactions();
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
    transactions,
    transactionsLoading,
    transactionsLoadingMore,
    transactionsError,
    transactionsHasMore,
    loadMoreTransactions,
    transactionSaving,
    recordTransaction: async (payload) => {
      const requestId = id;
      if (!requestId) return { ok: false, error: "Item not found." };
      setTransactionSaving(true);
      try {
        const result = await CreateItemInventoryTransaction(requestId, payload);
        if (activeItemId.current !== requestId) return { ok: true };
        if (result?.inventory) {
          setInventory(result.inventory);
        } else {
          const row = await GetItemInventory(requestId);
          if (activeItemId.current !== requestId) return { ok: true };
          setInventory(row);
        }
        toast.success("Transaction saved.");
        await refreshTransactions();
        return { ok: true };
      } catch (err) {
        const message = err?.message || "Failed to record the stock change.";
        toast.error(message);
        return { ok: false, error: message };
      } finally {
        setTransactionSaving(false);
      }
    },
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
    transactions,
    transactionsLoading,
    transactionsLoadingMore,
    transactionsError,
    transactionsHasMore,
    loadMoreTransactions,
    transactionSaving,
    recordTransaction,
  } = model;
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionDraft, setTransactionDraft] = useState(() => emptyTransactionDraft());
  const [transactionError, setTransactionError] = useState("");
  if (!inventory && transactionOpen) {
    setTransactionOpen(false);
    setTransactionError("");
  }

  const unit = inventory?.unit_of_measure ?? "";
  const projection = transactionOpen
    ? projectOnHand({
        onHand: inventory?.quantity ?? 0,
        direction: transactionDraft.direction,
        quantityRaw: transactionDraft.quantity,
      })
    : null;
  const prepared = transactionOpen
    ? prepareManualTransaction({
        direction: transactionDraft.direction,
        reason: transactionDraft.reason,
        quantityRaw: transactionDraft.quantity,
        unitPriceRaw: transactionDraft.unitPrice,
        noteRaw: transactionDraft.note,
        occurredOn: transactionDraft.occurredOn,
        onHand: inventory?.quantity ?? 0,
      })
    : null;
  const quantityText = String(transactionDraft.quantity ?? "").trim();
  const priceText = String(transactionDraft.unitPrice ?? "").trim();
  const typingDecimal =
    (prepared?.code === "quantity" && (quantityText === "" || /^\d+\.$/.test(quantityText))) ||
    (prepared?.code === "price" && /^\d+\.$/.test(priceText));
  const transactionMessage =
    transactionError ||
    (prepared && !prepared.ok && !typingDecimal ? prepared.error : "");

  const closeTransaction = useCallback(() => {
    if (transactionSaving) return;
    setTransactionOpen(false);
    setTransactionError("");
  }, [transactionSaving]);

  const openTransaction = () => {
    setTransactionDraft(emptyTransactionDraft());
    setTransactionError("");
    setTransactionOpen(true);
  };

  const saveTransaction = async () => {
    if (!prepared?.ok) {
      setTransactionError(prepared?.error || "Check the stock change and try again.");
      return;
    }
    setTransactionError("");
    const result = await recordTransaction(prepared.payload);
    if (result?.ok) {
      setTransactionOpen(false);
      return;
    }
    if (result?.error) setTransactionError(result.error);
  };

  return (
    <>
    <SectionCard
      title="Inventory"
      accent="bg-nv-purple-dark"
      action={
        <InventoryCardActions
          canWrite={canWrite}
          inventoryEditing={inventoryEditing}
          confirmingInventoryQty={confirmingInventoryQty}
          inventorySaving={inventorySaving}
          inventoryReady={Boolean(inventory)}
          onEdit={startInventoryEdit}
          onCancelEdit={cancelInventoryEdit}
          onSaveEdit={() => void saveInventoryEdit(false)}
          onTransaction={openTransaction}
        />
      }
    >
      {inventoryLoading && !inventory && <InventoryBodySkeleton />}

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
                <div className="space-y-1">
                  <span className={`inline-flex items-center gap-1 ${labelClass}`}>
                    Goal
                    <HelpIcon text={HELP_TEXT.goal} label={HELP_LABELS.goal} />
                  </span>
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
                </div>
              ) : (
                <p className="inline-flex items-center gap-1 text-[10px] font-medium text-nv-ink/55">
                  Goal range can be set by admins and founders.
                  <HelpIcon text={HELP_TEXT.goal} label={HELP_LABELS.goal} />
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
                  <span className={`inline-flex shrink-0 items-center gap-1 ${labelClass}`}>
                    Planned QTY
                    <HelpIcon text={HELP_TEXT.plannedQty} label={HELP_LABELS.plannedQty} />
                  </span>
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
                <span className={`inline-flex items-center gap-1 ${labelClass}`}>
                  Goal
                  <HelpIcon text={HELP_TEXT.goal} label={HELP_LABELS.goal} />
                </span>
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
          <InventoryTransactionList
            transactions={transactions}
            loading={transactionsLoading}
            loadingMore={transactionsLoadingMore}
            error={transactionsError}
            hasMore={transactionsHasMore}
            onLoadMore={() => void loadMoreTransactions()}
          />
        </>
      )}
    </SectionCard>
    <InventoryTransactionModal
      open={transactionOpen}
      unit={unit}
      draft={transactionDraft}
      onChange={(partial) => {
        setTransactionError("");
        setTransactionDraft((current) => ({ ...current, ...partial }));
      }}
      onHandAfter={
        projection ? formatOnHandAfter(projection.resulting, unit) : ""
      }
      message={transactionMessage}
      saving={transactionSaving}
      saveDisabled={!prepared?.ok}
      onCancel={closeTransaction}
      onSave={() => void saveTransaction()}
    />
    </>
  );
}
