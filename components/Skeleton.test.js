import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  BatchDetailSkeleton,
  BatchListSkeleton,
  BomSkeleton,
  HistorySkeleton,
  InventoryBodySkeleton,
  ItemDetailSkeleton,
  ItemListSkeleton,
  LotListSkeleton,
  ReceiptSkeleton,
} from "./Skeleton.jsx";

function html(component, props) {
  return renderToStaticMarkup(createElement(component, props));
}

function statusCount(markup) {
  return markup.match(/role="status"/g)?.length ?? 0;
}

test("skeletons are grey, named for assistive tech, and stay out of the way", () => {
  const source = readFileSync(new URL("./Skeleton.jsx", import.meta.url), "utf8");
  assert.match(source, /bg-nv-grey/);
  assert.doesNotMatch(source, /#[0-9a-fA-F]{3,8}/);
  assert.doesNotMatch(source, /animate-pulse/);

  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.skeleton-bone\s*\{[^}]*animation:\s*skeleton-pulse/);
  const reduced = css.slice(css.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reduced, /\.skeleton-bone[\s\S]*?animation:\s*none/);
});

test("item list rows keep the catalog row, the price stack, and the photo slot", () => {
  const markup = html(ItemListSkeleton);
  assert.equal(statusCount(markup), 1);
  assert.match(markup, /aria-busy="true"/);
  assert.match(markup, /data-skeleton="items"/);
  assert.match(markup, /<p class="sr-only">Loading items<\/p>/);
  assert.match(markup, /border-t border-black\/10/);
  assert.match(markup, /px-2\.5 py-2/);
  assert.match(markup, /sm:px-3/);
  assert.match(markup, /max-w-\[50%\]/);
  assert.match(markup, /h-10 w-10/);
  assert.match(markup, /border-brutal-xs border-black/);
  assert.match(markup, /bg-nv-grey/);
  assert.equal(markup.match(/<li/g).length, 6);
});

test("batch queue rows use the same three columns as a loaded batch", () => {
  const markup = html(BatchListSkeleton);
  assert.match(markup, /data-skeleton="batches"/);
  assert.match(markup, /Loading queue/);
  assert.match(markup, /grid-cols-\[minmax\(0,1fr\)_auto_auto\]/);
  assert.match(markup, /px-3 py-2/);
  assert.match(markup, /bg-nv-lavender\/20/);
  assert.equal(markup.match(/<li/g).length, 5);
});

test("a recipe outline matches a collapsed bill of materials row", () => {
  const markup = html(BomSkeleton);
  assert.equal(statusCount(markup), 1);
  assert.match(markup, /Loading recipe/);
  assert.match(markup, /h-5 w-5/);
  assert.match(markup, /px-3 py-2/);
  assert.match(markup, /bg-nv-teal\/15/);
  assert.equal(markup.match(/<li/g).length, 4);

  const nested = html(BomSkeleton, { announce: false, tone: "cyan" });
  assert.equal(statusCount(nested), 0);
  assert.match(nested, /aria-hidden="true"/);
  assert.match(nested, /bg-nv-cyan\/15/);
});

test("a receipt outline keeps the materials total and the double rule", () => {
  const markup = html(ReceiptSkeleton);
  assert.match(markup, /data-skeleton="receipt"/);
  assert.match(markup, /Loading receipt/);
  assert.match(markup, />Buy materials</);
  assert.match(markup, />Revenue</);
  assert.match(markup, /border-t border-black/);
  assert.match(markup, /border-t-4 border-double border-black/);
  assert.match(markup, /px-2 py-1\.5/);
});

test("item and batch pages outline the same sections the loaded page uses", () => {
  const item = html(ItemDetailSkeleton);
  assert.equal(statusCount(item), 1);
  assert.match(item, /Loading item/);
  assert.match(item, /lg:grid-cols-2/);
  assert.match(item, /lg:col-span-2/);
  assert.match(item, />Inventory</);
  assert.match(item, />Batches</);
  assert.match(item, />BOM</);
  assert.match(item, />Used In</);
  assert.match(item, />Production phases</);
  assert.match(item, />Photo</);
  assert.match(item, />Description</);
  assert.match(item, /h-36 w-full/);
  assert.match(item, /sm:h-40 sm:w-40/);
  assert.match(item, /data-skeleton="bom"/);
  assert.match(item, /data-skeleton="inventory"/);
  assert.match(item, /grid-cols-\[minmax\(0,1\.4fr\)_minmax\(0,1fr\)_auto\]/);
  assert.match(item, />SKU</);

  const batch = html(BatchDetailSkeleton);
  assert.equal(statusCount(batch), 1);
  assert.match(batch, /Loading batch/);
  assert.match(batch, />Batch data</);
  assert.match(batch, />Batch Receipt</);
  assert.match(batch, />Actions</);
  assert.match(batch, /data-skeleton="receipt"/);
  assert.match(batch, /data-skeleton="bom"/);
  assert.match(batch, /lg:grid-cols-2/);
  assert.match(batch, /bg-nv-green-muted/);
});

test("inventory, history, and vendor lots reserve the loaded blocks", () => {
  const inventory = html(InventoryBodySkeleton);
  assert.equal(statusCount(inventory), 1);
  assert.match(inventory, /Loading inventory/);
  assert.match(inventory, /max-h-40/);
  assert.match(inventory, /h-6 w-full/);
  assert.match(inventory, />History</);
  assert.match(inventory, /data-skeleton="history"/);

  const history = html(HistorySkeleton);
  assert.match(history, /Loading history/);
  assert.match(history, /divide-y divide-black\/10/);
  assert.equal(history.match(/<li/g).length, 3);

  const lots = html(LotListSkeleton);
  assert.match(lots, /Loading lots/);
  assert.match(lots, /-mx-4/);
  assert.match(lots, /px-4 py-2/);
});

test("the item and batch screens use those outlines instead of a loading sentence", () => {
  const root = new URL("../", import.meta.url);
  const checks = [
    ["app/items/page.jsx", "ItemListSkeleton", "Loading items…"],
    ["app/batches/page.jsx", "BatchListSkeleton", "Loading queue…"],
    ["app/items/[id]/page.jsx", "ItemDetailSkeleton", "Loading item…"],
    ["app/batches/[id]/page.jsx", "BatchDetailSkeleton", "Loading batch…"],
    ["app/items/[id]/components/InventorySection.jsx", "InventoryBodySkeleton", "Loading inventory…"],
    ["app/items/[id]/components/InventoryTransactions.jsx", "HistorySkeleton", "Loading history…"],
    ["app/items/[id]/components/VendorLotsSection.jsx", "LotListSkeleton", "Loading lots…"],
  ];
  for (const [file, component, sentence] of checks) {
    const source = readFileSync(new URL(file, root), "utf8");
    assert.match(source, new RegExp(component), file);
    assert.equal(source.includes(sentence), false, `${file} still says ${sentence}`);
  }

  const queue = readFileSync(new URL("app/batches/page.jsx", root), "utf8");
  const headerAt = queue.indexOf(">Batch<");
  const skeletonAt = queue.indexOf("<BatchListSkeleton");
  assert.ok(headerAt > 0 && headerAt < skeletonAt);
});
