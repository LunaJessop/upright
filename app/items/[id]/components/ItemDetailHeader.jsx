"use client";

import HelpIcon from "@/components/HelpIcon";
import { SavedItemPhoto } from "@/components/ItemPhoto";
import { brutalChrome } from "@/lib/chrome";
import { HELP_LABELS, HELP_TEXT } from "@/lib/helpText";
import { formatDate } from "@/lib/itemDetail";
import { formatMoney, isMakeItem as isMakeFlag, itemDisplayPrice } from "@/lib/pricing";
import { FieldRow, labelClass } from "./ItemDetailChrome";

export default function ItemDetailHeader({ item, canWrite, onEdit }) {
  const isMake = isMakeFlag(item.make_or_buy);
  const lotSkus = Array.isArray(item.item_skus) ? item.item_skus : [];
  const headerLabel = isMake
    ? lotSkus[0]?.sku ?? "No lot SKUs yet"
    : item.vendor_name || "Buy item";

  return (
    <>
      <header className={`mb-6 ${brutalChrome} overflow-hidden bg-nv-violet text-white`}>
        <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
          <div className="min-w-0 flex-1">
            <p className="break-words font-mono text-xs font-bold uppercase tracking-widest text-white">
              {headerLabel}
            </p>
            <h1 className="break-words text-3xl font-black uppercase leading-tight">
              {item.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`border-brutal-xs border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                    isMake ? "bg-nv-purple-dark" : "bg-nv-green-dark"
                  }`}
                >
                  {isMake ? "Make" : "Buy"}
                </span>
                <HelpIcon text={HELP_TEXT.makeVsBuy} label={HELP_LABELS.makeVsBuy} />
              </span>
              <span
                className={`border-brutal-xs border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  item.active ? "bg-nv-green-dark" : "bg-black/20 text-white"
                }`}
              >
                {item.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          {canWrite && (
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 border-brutal-xs border-black bg-nv-green-tint px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black"
            >
              Edit
            </button>
          )}
        </div>

        <div className="border-t-brutal-xs border-black bg-nv-paper p-4 text-nv-ink">
          <div className="flex flex-col gap-4 border-b border-black/10 py-3 sm:flex-row sm:items-start">
            <div className="w-full shrink-0 sm:w-40">
              <p className={labelClass}>Photo</p>
              <div className="mt-2">
                <SavedItemPhoto
                  itemId={item.id}
                  itemName={item.name || "this item"}
                  photo={item.photo ?? null}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className={labelClass}>Description</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-nv-ink">
                {item.description === "" || item.description == null ? "—" : item.description}
              </p>
            </div>
          </div>
          <div className="space-y-1">
            {!isMake && (
              <FieldRow
                label="Vendor"
                value={
                  item.vendor_name ||
                  (item.vendor == null ? "—" : `Vendor #${item.vendor}`)
                }
              />
            )}
            <div className="border-b border-black/10 py-3">
              <p className={labelClass}>Tags</p>
              {Array.isArray(item.tags) && item.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span
                      key={tag.id ?? tag.name}
                      className="border-brutal-xs border-black bg-nv-purple-dark px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs font-medium text-nv-ink/55">No tags</p>
              )}
            </div>
            <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
              <FieldRow label="Unit of measure" value={item.unit_of_measure} />
              <div className="border-b border-black/10 py-2.5">
                <p className={labelClass}>{isMake ? "Sell price" : "Unit cost"}</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatMoney(itemDisplayPrice(item))}
                </p>
                {!isMake && (
                  <p className="mt-1 text-[10px] font-medium leading-snug text-nv-ink/55">
                    Receiving a vendor lot updates this from total paid ÷ qty.
                  </p>
                )}
              </div>
              <FieldRow label="Created" value={formatDate(item.created_at)} />
              <FieldRow label="Updated" value={formatDate(item.updated_at)} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
