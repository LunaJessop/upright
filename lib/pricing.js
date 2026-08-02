export function isMakeItem(makeOrBuy) {
  return (
    makeOrBuy === "make" || makeOrBuy === true || makeOrBuy === "true"
  );
}

/** Catalog price shown in lists: sell for make, cost for buy. */
export function itemDisplayPrice(item) {
  if (!item) return null;
  if (isMakeItem(item.make_or_buy)) {
    return item.unit_sell_price ?? item.default_unit_price ?? null;
  }
  return item.unit_cost ?? item.default_unit_price ?? null;
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatMargin(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}%`;
}
