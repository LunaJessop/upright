import { isMakeItem as isMakeFlag } from "./pricing.js";

export function formatDate(value) {
  if (!value) return "—";
  // Date-only strings (YYYY-MM-DD) parse as UTC in JS — use local calendar day.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const local = new Date(y, m - 1, d);
    return local.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  // Midnight UTC from Postgres DATE → format in UTC to avoid day shift.
  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  if (isUtcMidnight && typeof value !== "string") {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatSkuSource(source) {
  if (source === "purchase") return "Purchase";
  if (source === "production") return "Production";
  return "—";
}

export function batchCountLabel(count) {
  return `${count} ${count === 1 ? "batch" : "batches"}`;
}

export function itemToDraft(item) {
  const isMake = isMakeFlag(item.make_or_buy);
  return {
    name: item.name == null ? "" : String(item.name),
    sku: item.sku == null ? "" : String(item.sku),
    description: item.description == null ? "" : String(item.description),
    make_or_buy: isMake ? "make" : "buy",
    unit_of_measure: item.unit_of_measure ?? "",
    default_unit_price: item.default_unit_price == null ? "" : String(item.default_unit_price),
    unit_cost:
      item.unit_cost != null
        ? String(item.unit_cost)
        : !isMake && item.default_unit_price != null
          ? String(item.default_unit_price)
          : "",
    unit_sell_price:
      item.unit_sell_price != null
        ? String(item.unit_sell_price)
        : isMake && item.default_unit_price != null
          ? String(item.default_unit_price)
          : "",
    vendor: item.vendor == null ? "" : String(item.vendor),
    active: Boolean(item.active),
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => ({
          ...(tag.id != null ? { id: Number(tag.id) } : {}),
          name: String(tag.name ?? "").trim(),
        }))
      : [],
  };
}

export function itemToBomLines(item, startId) {
  if (!Array.isArray(item.bom_items)) return [];
  return item.bom_items.map((line, index) => ({
    id: startId + index,
    itemId: String(line.component_item_id),
    quantity: String(line.quantity ?? "1"),
    unitOfMeasure: line.unit_of_measure ?? "",
    phaseId: line.phase_id == null || line.phase_id === "" ? "" : String(line.phase_id),
    phaseName: line.phase_name == null ? "" : String(line.phase_name),
  }));
}

export function itemToRouterPhases(item, startId) {
  if (!Array.isArray(item.router_phases)) return [];
  return item.router_phases.map((phase, index) => ({
    id: startId + index,
    sequence: phase.sequence ?? index + 1,
    name: phase.name == null ? "" : String(phase.name),
    description: phase.description == null ? "" : String(phase.description),
    estimated_minutes:
      phase.estimated_minutes == null ? "" : String(phase.estimated_minutes),
  }));
}

export function routerPhasesToPayload(phases) {
  return phases.map((phase, index) => ({
    sequence: index + 1,
    name: phase.name.trim(),
    description: phase.description.trim(),
    estimated_minutes:
      phase.estimated_minutes.trim() === "" ? null : phase.estimated_minutes.trim(),
  }));
}

export function formatQty(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value ?? "—";
  return Number.isInteger(number)
    ? String(number)
    : number.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function stockStatusLabel(status) {
  if (status === "below") return "Below goal";
  if (status === "above") return "Above goal";
  if (status === "on_track") return "On track";
  return null;
}

export function formatPlannedDelta(delta, unit) {
  const n = Number(delta);
  if (!Number.isFinite(n) || n === 0) return "No open batch effect";
  const sign = n > 0 ? "+" : "−";
  const abs = formatQty(Math.abs(n));
  const unitSuffix = unit ? ` ${unit}` : "";
  return `After open batches (${sign}${abs}${unitSuffix})`;
}
