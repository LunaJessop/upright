"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CreatePurchaseLot,
  DeletePurchaseLot,
  GetItemById,
  GetPurchaseLots,
} from "@/app/api/apiHandler";
import { useToast } from "@/components/Toast";
import { listClass, rowStripe } from "@/lib/chrome";
import { formatDate, formatQty } from "@/lib/itemDetail";
import { formatMoney, isMakeItem as isMakeFlag } from "@/lib/pricing";
import { SectionCard } from "./ItemDetailChrome";

export function useVendorLots({ id, item, setItem, reloadInventory }) {
  const toast = useToast();
  const [purchaseLots, setPurchaseLots] = useState([]);
  const [purchaseLotsLoading, setPurchaseLotsLoading] = useState(false);
  const [lotNumber, setLotNumber] = useState("");
  const [lotQty, setLotQty] = useState("1");
  const [lotTotalCost, setLotTotalCost] = useState("");
  const [lotArrivalDate, setLotArrivalDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [lotError, setLotError] = useState("");
  const [receivingLot, setReceivingLot] = useState(false);
  const [deletingLotId, setDeletingLotId] = useState(null);
  const [confirmingLotId, setConfirmingLotId] = useState(null);

  const loadPurchaseLots = useCallback(async () => {
    if (!id) {
      setPurchaseLots([]);
      return;
    }
    setPurchaseLotsLoading(true);
    setLotError("");
    try {
      const rows = await GetPurchaseLots(id);
      setPurchaseLots(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setPurchaseLots([]);
      setLotError(err?.message || "Failed to load purchase lots.");
    } finally {
      setPurchaseLotsLoading(false);
    }
  }, [id]);

  const lotsKey =
    item?.id && !isMakeFlag(item.make_or_buy)
      ? `${id}:${item.id}:${item.make_or_buy}`
      : "";
  const [seenLotsKey, setSeenLotsKey] = useState(lotsKey);
  if (seenLotsKey !== lotsKey) {
    setSeenLotsKey(lotsKey);
    setPurchaseLots([]);
    setLotError("");
    setPurchaseLotsLoading(Boolean(lotsKey));
  }

  useEffect(() => {
    if (!item?.id || isMakeFlag(item.make_or_buy)) return undefined;
    let cancelled = false;
    GetPurchaseLots(id)
      .then((rows) => {
        if (!cancelled) setPurchaseLots(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setPurchaseLots([]);
          setLotError(err?.message || "Failed to load purchase lots.");
        }
      })
      .finally(() => {
        if (!cancelled) setPurchaseLotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item?.id, item?.make_or_buy, id]);

  const handleReceiveLot = async () => {
    const qty = Number(lotQty);
    const total = Number(lotTotalCost);
    if (!lotNumber.trim()) {
      const message = "Vendor lot # is required.";
      setLotError(message);
      toast.error(message);
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      const message = "Quantity must be a positive number.";
      setLotError(message);
      toast.error(message);
      return;
    }
    if (!Number.isFinite(total) || total < 0) {
      const message = "Total cost must be a non-negative number.";
      setLotError(message);
      toast.error(message);
      return;
    }
    setReceivingLot(true);
    setLotError("");
    try {
      await CreatePurchaseLot(id, {
        lot_number: lotNumber.trim(),
        quantity: qty,
        total_cost: total,
        arrival_date: lotArrivalDate || undefined,
      });
      setLotNumber("");
      setLotQty("1");
      setLotTotalCost("");
      setLotArrivalDate(new Date().toISOString().slice(0, 10));
      const [updatedItem] = await Promise.all([
        GetItemById(id),
        reloadInventory(),
        loadPurchaseLots(),
      ]);
      if (updatedItem?.id) setItem(updatedItem);
      toast.success("Lot received.");
    } catch (err) {
      const message = err?.message || "Failed to receive lot.";
      setLotError(message);
      toast.error(message);
    } finally {
      setReceivingLot(false);
    }
  };

  const handleDeleteLot = async (purchaseLotId) => {
    setDeletingLotId(purchaseLotId);
    setLotError("");
    try {
      await DeletePurchaseLot(id, purchaseLotId);
      setConfirmingLotId(null);
      const [updatedItem] = await Promise.all([
        GetItemById(id),
        reloadInventory(),
        loadPurchaseLots(),
      ]);
      if (updatedItem?.id) setItem(updatedItem);
      toast.success("Lot deleted.");
    } catch (err) {
      const message = err?.message || "Failed to delete lot.";
      setLotError(message);
      toast.error(message);
    } finally {
      setDeletingLotId(null);
    }
  };

  const cancelLotDraft = () => {
    setLotNumber("");
    setLotQty("1");
    setLotTotalCost("");
    setLotArrivalDate(new Date().toISOString().slice(0, 10));
    setLotError("");
  };

  return {
    loadPurchaseLots,
    purchaseLots,
    purchaseLotsLoading,
    lotNumber,
    setLotNumber,
    lotQty,
    setLotQty,
    lotTotalCost,
    setLotTotalCost,
    lotArrivalDate,
    setLotArrivalDate,
    lotError,
    receivingLot,
    deletingLotId,
    confirmingLotId,
    setConfirmingLotId,
    handleReceiveLot,
    handleDeleteLot,
    cancelLotDraft,
  };
}

export default function VendorLotsSection({ item, canWrite, editing, model }) {
  const {
    purchaseLots,
    purchaseLotsLoading,
    lotNumber,
    setLotNumber,
    lotQty,
    setLotQty,
    lotTotalCost,
    setLotTotalCost,
    lotArrivalDate,
    setLotArrivalDate,
    lotError,
    receivingLot,
    deletingLotId,
    confirmingLotId,
    setConfirmingLotId,
    handleReceiveLot,
    handleDeleteLot,
    cancelLotDraft,
  } = model;

  return (
    <SectionCard title="Vendor lots" accent="bg-nv-purple-dark">
      <p className="mb-3 text-[10px] font-medium leading-snug text-nv-ink/55">
        Enter the total amount paid for this receive — we divide by qty to set
        unit cost. Same lot # can be received more than once. Deleting a
        receive reverses its quantity.
      </p>
      {lotError && (
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-red-600">
          {lotError}
        </p>
      )}
      {!editing && canWrite && (
        <div className="mb-4 space-y-2 border-b border-black/10 pb-4">
          <p className="text-[10px] font-black uppercase tracking-wide">
            Receive lot
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-32 flex-1 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                Vendor lot #
              </span>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="Supplier batch / lot"
                className="w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
              />
            </label>
            <label className="w-20 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                Qty
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={lotQty}
                onChange={(e) => setLotQty(e.target.value)}
                className="w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
              />
            </label>
            <label className="w-24 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                Total cost
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={lotTotalCost}
                onChange={(e) => setLotTotalCost(e.target.value)}
                placeholder="0.00"
                className="w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
              />
            </label>
            <label className="w-36 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
                Arrival date
              </span>
              <input
                type="date"
                value={lotArrivalDate}
                onChange={(e) => setLotArrivalDate(e.target.value)}
                className="w-full border-brutal-xs border-black bg-nv-paper px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
              />
            </label>
            <button
              type="button"
              onClick={cancelLotDraft}
              disabled={receivingLot}
              className="border-brutal-xs border-black bg-nv-paper px-3 py-1 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleReceiveLot()}
              disabled={receivingLot}
              className="border-brutal-xs border-black bg-nv-violet px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
            >
              {receivingLot ? "Receiving…" : "Receive"}
            </button>
          </div>
        </div>
      )}

      {purchaseLotsLoading && (
        <p className="text-xs font-medium text-nv-ink/55">Loading lots…</p>
      )}

      {!purchaseLotsLoading && purchaseLots.length > 0 ? (
        <ul className={`${listClass} -mx-4`}>
          {purchaseLots.map((row, index) => (
            <li
              key={row.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2 ${rowStripe(index, "lavender")}`}
            >
              <div>
                <span className="font-mono text-sm font-black">
                  {row.lot_number}
                </span>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-nv-ink/60">
                  <span>
                    {formatQty(row.quantity)}
                    {item.unit_of_measure ? ` ${item.unit_of_measure}` : ""}
                  </span>
                  <span>
                    {formatMoney(
                      row.total_cost ??
                        Number(row.quantity) * Number(row.unit_cost)
                    )}{" "}
                    total
                  </span>
                  <span>{formatMoney(row.unit_cost)} / ea</span>
                  <span>
                    Arrived {formatDate(row.arrival_date ?? row.received_at)}
                  </span>
                </div>
              </div>
              {canWrite &&
                (confirmingLotId === row.id ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-nv-ink/70">
                      Reverse qty?
                    </span>
                    <button
                      type="button"
                      onClick={() => setConfirmingLotId(null)}
                      disabled={deletingLotId === row.id}
                      className="border-brutal-xs border-black bg-nv-paper px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black disabled:opacity-40"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLot(row.id)}
                      disabled={deletingLotId === row.id}
                      className="border-brutal-xs border-black bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                    >
                      {deletingLotId === row.id ? "Deleting…" : "Yes, delete"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingLotId(row.id)}
                    disabled={deletingLotId != null}
                    className="border-brutal-xs border-black bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                  >
                    Delete
                  </button>
                ))}
            </li>
          ))}
        </ul>
      ) : (
        !purchaseLotsLoading && (
          <p className="text-xs font-medium text-nv-ink/55">
            No vendor lots received yet.
          </p>
        )
      )}
    </SectionCard>
  );
}
