"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  GetAllInventory,
  UpdateItemInventory,
  UpdateItemInventoryGoal,
} from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import InventoryRangeBar from "@/components/InventoryRangeBar";
import { ROLE_RANK } from "@/lib/auth";

const brutalChrome = "border-brutal border-black shadow-brutal";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";
const editInputClass =
  "w-full border-brutal border-black bg-nv-paper px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-nv-violet";

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

function StockStatusIcon({ status }) {
  const label = stockStatusLabel(status);
  if (!label) return null;

  if (status === "above") {
    return (
      <span
        className="inline-flex text-nv-violet"
        title={label}
        aria-label={label}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </span>
    );
  }

  if (status === "below") {
    return (
      <span
        className="inline-flex text-red-600"
        title={label}
        aria-label={label}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="inline-flex text-nv-teal"
      title={label}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="square"
        strokeLinejoin="miter"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function PencilIcon({ className = "h-4 w-4" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function InventoryCard({
  row,
  canWrite,
  canEditGoals,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaved,
}) {
  const [draftQty, setDraftQty] = useState("");
  const [draftGoalMin, setDraftGoalMin] = useState("");
  const [draftGoalMax, setDraftGoalMax] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editing) return;
    setDraftQty(row.quantity == null ? "0" : String(row.quantity));
    setDraftGoalMin(row.goal_min == null ? "" : String(row.goal_min));
    setDraftGoalMax(row.goal_max == null ? "" : String(row.goal_max));
    setError("");
  }, [editing, row]);

  const unit = row.unit_of_measure ?? "";
  const unitSuffix = unit ? ` ${unit}` : "";

  const handleSave = async () => {
    const qty = Number(draftQty);
    if (!Number.isFinite(qty) || qty < 0) {
      setError("Current quantity must be a non-negative number.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      let next = await UpdateItemInventory(row.item_id, { quantity: qty });

      if (canEditGoals) {
        const minRaw = draftGoalMin.trim();
        const maxRaw = draftGoalMax.trim();
        if (minRaw !== "" || maxRaw !== "") {
          const goalMin = Number(minRaw);
          const goalMax = Number(maxRaw);
          if (!Number.isFinite(goalMin) || goalMin < 0) {
            setError("Goal min must be a non-negative number.");
            setSaving(false);
            return;
          }
          if (!Number.isFinite(goalMax) || goalMax < goalMin) {
            setError("Goal max must be ≥ goal min.");
            setSaving(false);
            return;
          }
          next = await UpdateItemInventoryGoal(row.item_id, {
            goal_min: goalMin,
            goal_max: goalMax,
          });
        }
      }

      onSaved({
        ...row,
        ...next,
        item_id: row.item_id,
        item_name: row.item_name,
        make_or_buy: row.make_or_buy,
        active: row.active,
      });
    } catch (err) {
      setError(err?.message || "Failed to save inventory.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`${brutalChrome} bg-nv-paper`}>
      <div className="flex items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/items/${row.item_id}`}
              className="text-sm font-black uppercase tracking-wide text-nv-ink hover:text-nv-violet"
            >
              {row.item_name}
            </Link>
            <span className="border border-black bg-nv-canvas px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">
              {String(row.make_or_buy || "").toLowerCase() === "make"
                ? "Make"
                : "Buy"}
            </span>
          </div>

          {editing ? (
            <div className="space-y-3">
              <label className="block max-w-xs space-y-1">
                <span className={labelClass}>Current QTY</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draftQty}
                  onChange={(e) => setDraftQty(e.target.value)}
                  className={editInputClass}
                />
              </label>
              {canEditGoals ? (
                <div className="grid max-w-md gap-3 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className={labelClass}>Goal min</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draftGoalMin}
                      onChange={(e) => setDraftGoalMin(e.target.value)}
                      className={editInputClass}
                      placeholder="Optional"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className={labelClass}>Goal max</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draftGoalMax}
                      onChange={(e) => setDraftGoalMax(e.target.value)}
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
              {error && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={saving}
                  className="border-brutal border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
                >
                  Go back
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="border-brutal border-black bg-nv-violet px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className={labelClass}>Current </span>
                  {formatQty(row.quantity)}
                  {unitSuffix}
                  <StockStatusIcon status={row.status} />
                </span>
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className={labelClass}>Planned </span>
                  {formatQty(row.planned_quantity)}
                  {unitSuffix}
                  <StockStatusIcon status={row.planned_status} />
                </span>
                <span>
                  <span className={labelClass}>Goal </span>
                  {row.goal_min != null && row.goal_max != null
                    ? `${formatQty(row.goal_min)} – ${formatQty(row.goal_max)}${unitSuffix}`
                    : "Not set"}
                </span>
              </div>
              <InventoryRangeBar
                quantity={row.quantity}
                plannedQuantity={row.planned_quantity}
                goalMin={row.goal_min}
                goalMax={row.goal_max}
                unit={unit}
              />
            </>
          )}
        </div>

        {!editing && canWrite && (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={onStartEdit}
              aria-label={`Edit inventory for ${row.item_name}`}
              title="Edit inventory"
              className="flex h-10 w-10 items-center justify-center border-brutal border-black bg-nv-cyan text-black shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <PencilIcon />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function InventoryPage() {
  const { user, canWrite } = useAuth();
  const canEditGoals =
    canWrite && (ROLE_RANK[user?.role] ?? 0) >= ROLE_RANK.admin;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await GetAllInventory();
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || "Failed to load inventory.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  return (
    <div className="min-h-full bg-nv-canvas px-4 py-6 text-nv-ink">
      <div className="mx-auto max-w-4xl">
        <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6 text-white`}>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-white/80">
            Items
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight">
            Inventory
          </h1>
          <p className="mt-2 text-sm font-medium text-white/90">
            Stock levels across your catalog — edit quantities without opening
            each item.
          </p>
        </header>

        <section className="space-y-3">
          {loading && (
            <p className="text-xs font-medium text-nv-ink/55">
              Loading inventory…
            </p>
          )}

          {!loading && error && (
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">
              {error}
            </p>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className={`${brutalChrome} bg-nv-paper p-6`}>
              <p className="text-xs font-medium text-nv-ink/55">
                No items yet.{" "}
                <Link href="/items/new-item" className="font-bold text-nv-violet underline">
                  Add an item
                </Link>{" "}
                to track inventory.
              </p>
            </div>
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="space-y-2">
              {rows.map((row) => (
                <InventoryCard
                  key={row.item_id}
                  row={row}
                  canWrite={canWrite}
                  canEditGoals={canEditGoals}
                  editing={editingId === row.item_id}
                  onStartEdit={() => setEditingId(row.item_id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setRows((prev) =>
                      prev.map((r) =>
                        r.item_id === updated.item_id ? updated : r
                      )
                    );
                    setEditingId(null);
                  }}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
