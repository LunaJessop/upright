import { brutalChrome, listClass, nestedHeaderClass, rowStripe } from "@/lib/chrome";

/**
 * Grey stand-ins for the item and batch screens.
 * Row padding, columns, and section frames follow the loaded layout
 * so the swap does not jump. The pulse is turned off when the
 * visitor prefers reduced motion (see globals.css).
 */

const quietLabel =
  "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

const fieldClass =
  "flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-black/10 py-2.5 last:border-b-0 lg:[&:nth-child(odd):nth-last-child(2)]:border-b-0";

const ITEM_NAME_WIDTHS = ["w-40", "w-56", "w-36", "w-48", "w-44", "w-32"];

function placeholders(count, prefix) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);
}

function Bone({ className = "inline-block" }) {
  return (
    <span aria-hidden="true" className={`skeleton-bone bg-nv-grey ${className}`} />
  );
}

export function SkeletonBlock({ className = "inline-block h-4 w-16" }) {
  return <Bone className={className} />;
}

function SkeletonRegion({ label, announce = true, skeleton, children }) {
  if (!announce) {
    return (
      <div aria-hidden="true" data-skeleton={skeleton}>
        {children}
      </div>
    );
  }
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-skeleton={skeleton}
    >
      <p className="sr-only">{label}</p>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function SectionShell({ title, accent, help = false, action = null, className = "", children }) {
  return (
    <section className={`${brutalChrome} bg-nv-paper ${className}`}>
      <header
        className={`flex flex-wrap items-center justify-between gap-2 border-b-brutal-xs border-black ${accent} px-4 py-2`}
      >
        <h2 className="flex min-w-0 items-center gap-1.5 text-sm font-black uppercase tracking-wide">
          <span>{title}</span>
          {help ? (
            <Bone className="inline-block h-4 w-4 rounded-full border border-black" />
          ) : null}
        </h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function FieldSkeleton({ label, paired = false }) {
  const rowClass = paired
    ? fieldClass
    : "flex flex-wrap items-start justify-between gap-x-4 gap-y-1 border-b border-black/10 py-2.5";
  return (
    <div className={rowClass}>
      <span className={`shrink-0 ${quietLabel}`}>{label}</span>
      <Bone className="inline-block h-4 w-16" />
    </div>
  );
}

export function HistorySkeleton({ rows = 3, announce = true }) {
  return (
    <SkeletonRegion label="Loading history" announce={announce} skeleton="history">
      <ul className="divide-y divide-black/10">
        {placeholders(rows, "history").map((key) => (
          <li key={key} className="py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <Bone className="inline-block h-3 w-20" />
              <Bone className="inline-block h-3 w-12" />
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-2">
              <Bone className="inline-block h-2.5 w-16" />
              <Bone className="inline-block h-2.5 w-10" />
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              <Bone className="inline-block h-2.5 w-32" />
              <Bone className="inline-block h-2.5 w-14 shrink-0" />
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

export function InventoryBodySkeleton({ announce = true }) {
  return (
    <SkeletonRegion label="Loading inventory" announce={announce} skeleton="inventory">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 border-b border-black/10 py-2.5">
          <Bone className="inline-block h-3 w-24" />
          <Bone className="inline-block h-4 w-16" />
        </div>
        <div className="border-b border-black/10 py-2.5">
          <div className="flex items-center justify-between gap-4">
            <Bone className="inline-block h-3 w-24" />
            <Bone className="inline-block h-4 w-16" />
          </div>
          <div className="mt-1 flex justify-end">
            <Bone className="inline-block h-2.5 w-28" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 py-2.5">
          <Bone className="inline-block h-3 w-12" />
          <Bone className="inline-block h-4 w-24" />
        </div>
        <div className="space-y-1.5">
          <Bone className="block h-4 w-full" />
          <Bone className="block h-6 w-full border border-black" />
          <Bone className="block h-4 w-full" />
          <Bone className="block h-3 w-2/3" />
        </div>
      </div>
      <div className="mt-3 border-t border-black/10 pt-3">
        <p className={quietLabel}>History</p>
        <div
          className="mt-1 max-h-40 overflow-y-auto overscroll-contain sm:max-h-48"
          role="region"
          aria-label="Stock history"
        >
          <HistorySkeleton announce={false} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function LotListSkeleton({ rows = 3, announce = true }) {
  return (
    <SkeletonRegion label="Loading lots" announce={announce} skeleton="lots">
      <ul className={`${listClass} -mx-4`}>
        {placeholders(rows, "lot").map((key, index) => (
          <li
            key={key}
            className={`flex flex-wrap items-center justify-between gap-3 px-4 py-2 ${rowStripe(index, "lavender")}`}
          >
            <div>
              <Bone className="inline-block h-4 w-28" />
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <Bone className="inline-block h-3 w-12" />
                <Bone className="inline-block h-3 w-16" />
                <Bone className="inline-block h-3 w-14" />
                <Bone className="inline-block h-3 w-24" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

export function ItemListSkeleton({ rows = 6 }) {
  const keys = placeholders(rows, "item");
  return (
    <SkeletonRegion label="Loading items" skeleton="items">
      <ul className={`${listClass} border-t border-black/10`}>
        {keys.map((key, index) => (
          <li key={key}>
            <div className={`block min-w-0 px-2.5 py-2 sm:px-3 ${rowStripe(index)}`}>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Bone
                      className={`inline-block h-4 ${ITEM_NAME_WIDTHS[index % ITEM_NAME_WIDTHS.length]}`}
                    />
                    <Bone className="inline-block h-4 w-10" />
                    <Bone className="inline-block h-4 w-14" />
                  </div>
                  <Bone className="mt-1 block h-4 w-3/4 max-w-md" />
                </div>
                <div className="flex max-w-[50%] shrink-0 items-center justify-end gap-1.5 sm:max-w-[46%] sm:gap-2">
                  <div className="flex min-w-0 flex-col items-end gap-1 text-right">
                    <Bone className="inline-block h-2 w-8" />
                    <Bone className="inline-block h-3 w-16" />
                  </div>
                  <Bone className="inline-block h-10 w-10 shrink-0 border-brutal-xs border-black" />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

export function BatchListSkeleton({ rows = 5 }) {
  return (
    <SkeletonRegion label="Loading queue" skeleton="batches">
      <ul className={listClass}>
        {placeholders(rows, "batch").map((key, index) => (
          <li key={key}>
            <div className={`block px-3 py-2 ${rowStripe(index, "lavender")}`}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
                <p className="min-w-0 text-sm leading-snug">
                  <Bone className="inline-block h-4 w-2/3 max-w-xs" />
                </p>
                <Bone className="inline-block h-4 w-16 shrink-0" />
                <Bone className="inline-block h-3 w-10" />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-0.5">
                <Bone className="inline-block h-4 w-16" />
                <Bone className="inline-block h-4 w-14" />
                <Bone className="inline-block h-4 w-20" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

export function BomSkeleton({ rows = 4, tone = "teal", announce = true }) {
  return (
    <SkeletonRegion label="Loading recipe" announce={announce} skeleton="bom">
      <ul className={listClass}>
        {placeholders(rows, "bom").map((key, index) => (
          <li key={key} className={rowStripe(index, tone)}>
            <div className="px-3 py-2">
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-block h-5 w-5 shrink-0 ${
                    index === 0
                      ? "skeleton-bone border-brutal-xs border-black bg-nv-grey"
                      : ""
                  }`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Bone className="inline-block h-3 w-36" />
                    <Bone className="inline-block h-4 w-10" />
                  </div>
                  <Bone className="mt-1 block h-2.5 w-28" />
                </div>
                <span className="shrink-0 text-right text-xs font-semibold">
                  <Bone className="inline-block h-3 w-12" />
                  <Bone className="mt-0.5 block h-2.5 w-8" />
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SkeletonRegion>
  );
}

function ReceiptLineSkeleton() {
  return (
    <div className="flex items-baseline justify-between gap-2 px-2 py-1.5">
      <Bone className="inline-block h-3 w-28 shrink-0" />
      <Bone className="inline-block h-2.5 min-w-0 flex-1" />
      <Bone className="inline-block h-3 w-12 shrink-0" />
    </div>
  );
}

export function ReceiptSkeleton({ announce = true }) {
  return (
    <SkeletonRegion label="Loading receipt" announce={announce} skeleton="receipt">
      <div>
        <p className="px-2 py-1.5 text-xs font-semibold">Buy materials</p>
        <ReceiptLineSkeleton />
        <ReceiptLineSkeleton />
        <ReceiptLineSkeleton />
        <div className="border-t border-black">
          <ReceiptLineSkeleton />
        </div>
        <div className="mt-3">
          <p className="px-2 py-1.5 text-xs font-semibold">Revenue</p>
          <ReceiptLineSkeleton />
          <ReceiptLineSkeleton />
          <div className="border-t-4 border-double border-black">
            <ReceiptLineSkeleton />
          </div>
          <ReceiptLineSkeleton />
        </div>
      </div>
    </SkeletonRegion>
  );
}

function PhaseBlock({ tone = "purple" }) {
  const stripe = tone === "green" ? "teal" : "violet";
  return (
    <div className="space-y-3">
      <Bone className="block h-3 w-full max-w-lg" />
      <div>
        <div className={`${nestedHeaderClass[tone] || nestedHeaderClass.purple} px-3 py-2`}>
          <Bone className="inline-block h-4 w-32" />
        </div>
        <ul className={listClass}>
          {placeholders(3, `phase-${tone}`).map((key, index) => (
            <li
              key={key}
              className={`flex items-start gap-2 px-3 py-2 ${rowStripe(index, stripe)}`}
            >
              <Bone className="inline-block h-3 w-4" />
              <Bone className="inline-block h-3 w-40" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ItemDetailHeaderSkeleton() {
  return (
    <header className={`mb-6 ${brutalChrome} overflow-hidden bg-nv-violet`}>
      <div className="flex flex-wrap items-start justify-between gap-3 p-6 pb-4">
        <div className="min-w-0 flex-1">
          <Bone className="block h-4 w-32" />
          <Bone className="block h-9 w-3/5 max-w-md" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Bone className="inline-block h-5 w-14 border border-black" />
            <Bone className="inline-block h-4 w-4 rounded-full border border-black" />
            <Bone className="inline-block h-5 w-16 border border-black" />
          </div>
        </div>
      </div>
      <div className="border-t-brutal-xs border-black bg-nv-paper p-4">
        <div className="flex flex-col gap-4 border-b border-black/10 py-3 sm:flex-row sm:items-start">
          <div className="w-full shrink-0 sm:w-40">
            <p className={quietLabel}>Photo</p>
            <div className="skeleton-bone mt-2 h-36 w-full border-brutal-xs border-black bg-nv-grey sm:h-40 sm:w-40" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={quietLabel}>Description</p>
            <div className="mt-2 space-y-1">
              <Bone className="block h-5 w-full" />
              <Bone className="block h-5 w-4/5" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <div className="border-b border-black/10 py-3">
            <p className={quietLabel}>Tags</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Bone className="inline-block h-4 w-14" />
              <Bone className="inline-block h-4 w-16" />
            </div>
          </div>
          <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            <FieldSkeleton label="Unit of measure" />
            <div className="border-b border-black/10 py-2.5">
              <Bone className="inline-block h-3 w-16" />
              <Bone className="mt-1 block h-4 w-20" />
            </div>
            <FieldSkeleton label="Created" />
            <FieldSkeleton label="Updated" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function ItemDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading item" skeleton="item">
      <ItemDetailHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionShell title="Inventory" accent="bg-nv-purple-dark">
          <InventoryBodySkeleton announce={false} />
        </SectionShell>
        <SectionShell
          title="Batches"
          accent="bg-nv-purple-dark"
          help
          action={
            <div className="flex items-center gap-2">
              <Bone className="inline-block h-3 w-14" />
              <Bone className="inline-block h-7 w-7" />
            </div>
          }
        >
          <div className="-m-4">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-3 border-b border-black/10 bg-nv-paper px-4 py-1.5 text-[10px] font-black uppercase tracking-wide text-nv-ink/55">
              <span>SKU</span>
              <span>Source</span>
              <span>Date</span>
            </div>
            <ul className={listClass}>
              {placeholders(3, "item-batch").map((key, index) => (
                <li
                  key={key}
                  className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 ${rowStripe(index, "lavender")}`}
                >
                  <Bone className="inline-block h-4 w-28" />
                  <Bone className="inline-block h-3 w-20" />
                  <Bone className="inline-block h-3 w-16" />
                </li>
              ))}
            </ul>
          </div>
        </SectionShell>
        <SectionShell
          title="BOM"
          accent="bg-nv-green-dark"
          help
          action={<Bone className="inline-block h-6 w-12" />}
        >
          <Bone className="mb-3 block h-3 w-full max-w-lg" />
          <BomSkeleton tone="teal" announce={false} />
        </SectionShell>
        <SectionShell title="Used In" accent="bg-nv-purple-dark" help>
          <ul className={`${listClass} -mx-4 -mb-4`}>
            {placeholders(2, "used").map((key, index) => (
              <li
                key={key}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 ${rowStripe(index, "lavender")}`}
              >
                <Bone className="inline-block h-4 w-40" />
                <Bone className="inline-block h-3 w-16" />
              </li>
            ))}
          </ul>
        </SectionShell>
        <div className="lg:col-span-2">
          <SectionShell title="Production phases" accent="bg-nv-purple-dark" help>
            <PhaseBlock tone="purple" />
          </SectionShell>
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function BatchDetailSkeleton() {
  return (
    <SkeletonRegion label="Loading batch" skeleton="batch">
      <header className={`mb-6 ${brutalChrome} bg-nv-violet p-6`}>
        <Bone className="block h-4 w-36" />
        <Bone className="block h-9 w-2/3 max-w-md" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Bone className="inline-block h-5 w-16 border border-black" />
          <Bone className="inline-block h-5 w-20 border border-black" />
        </div>
        <Bone className="mt-3 block h-5 w-48" />
      </header>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SectionShell title="Batch data" accent="bg-nv-purple-dark">
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8">
            {[
              "Item",
              "Item link",
              "SKU",
              "Quantity",
              "Status",
              "Started",
              "Completed",
              "Created",
            ].map((label) => (
              <FieldSkeleton key={label} label={label} paired />
            ))}
          </div>
        </SectionShell>
        <SectionShell title="Batch Receipt" accent="bg-nv-green-dark" help>
          <ReceiptSkeleton announce={false} />
        </SectionShell>
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <SectionShell title="Actions" accent="bg-nv-purple-dark">
          <Bone className="block h-3 w-full" />
          <Bone className="mt-2 block h-3 w-4/5" />
          <Bone className="mt-2 block h-8 w-full" />
        </SectionShell>
        <SectionShell title="BOM" accent="bg-nv-green-dark" help>
          <Bone className="mb-3 block h-3 w-full max-w-lg" />
          <BomSkeleton tone="cyan" announce={false} />
        </SectionShell>
      </div>
      <SectionShell title="Production phases" accent="bg-nv-green-dark" help>
        <PhaseBlock tone="green" />
      </SectionShell>
    </SkeletonRegion>
  );
}
