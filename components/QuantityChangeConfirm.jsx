"use client";

function formatQty(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value ?? "—";
  return Number.isInteger(number)
    ? String(number)
    : number.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function quantityChanged(previous, next) {
  const oldQty = Number(previous ?? 0);
  const newQty = Number(next);
  if (!Number.isFinite(oldQty) || !Number.isFinite(newQty)) return false;
  return oldQty !== newQty;
}

export default function QuantityChangeConfirm({
  oldQuantity,
  newQuantity,
  unit = "",
  saving = false,
  onCancel,
  onConfirm,
}) {
  const suffix = unit ? ` ${unit}` : "";

  return (
    <div className="space-y-2 border-brutal border-black bg-nv-cyan/25 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide">
        Confirm quantity change
      </p>
      <p className="text-xs font-semibold">
        {formatQty(oldQuantity)}
        {suffix}
        {" → "}
        {formatQty(newQuantity)}
        {suffix}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="border-brutal border-black bg-nv-paper px-3 py-1.5 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={saving}
          className="border-brutal border-black bg-nv-violet px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Confirm"}
        </button>
      </div>
    </div>
  );
}
