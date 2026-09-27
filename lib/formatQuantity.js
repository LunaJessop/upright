import { convertQuantity, normalizeUnit } from "./units.js";

/**
 * Short names for canonical unit codes. Conversion factors stay in units.js.
 * Unknown codes are left unchanged.
 */
const FRIENDLY_UNIT_LABELS = {
  ea: "each",
  oz: "oz",
  lb: "lb",
  short_ton: "short ton",
  mg: "mg",
  g: "g",
  kg: "kg",
  t: "t",
  mm: "mm",
  cm: "cm",
  m: "m",
  ft: "ft",
  yd: "yd",
  sq_mm: "sq mm",
  sq_cm: "sq cm",
  sq_m: "sq m",
  sq_ft: "sq ft",
  sq_yd: "sq yd",
  tsp: "tsp",
  tbsp: "tbsp",
  fl_oz: "fl oz",
  cup: "cup",
  pt: "pt",
  qt: "qt",
  gal: "gal",
  mL: "mL",
  cL: "cL",
  dL: "dL",
  L: "L",
};

/**
 * Units we may scale between. Order does not matter; size comes from
 * convertQuantity. Length and area are split so a US entry never becomes
 * metric, and the reverse.
 */
const READABLE_SYSTEMS = [
  ["ea"],
  ["oz", "lb", "short_ton"],
  ["mg", "g", "kg", "t"],
  ["mm", "cm", "m"],
  ["ft", "yd"],
  ["sq_mm", "sq_cm", "sq_m"],
  ["sq_ft", "sq_yd"],
  ["tsp", "tbsp", "fl_oz", "cup", "pt", "qt", "gal"],
  ["mL", "cL", "dL", "L"],
];

const SYSTEM_BY_UNIT = new Map();
for (const system of READABLE_SYSTEMS) {
  for (const unit of system) {
    SYSTEM_BY_UNIT.set(unit, system);
  }
}

const SCALE_EPSILON = 1e-9;

export function friendlyUnitLabel(unit) {
  const normalized = normalizeUnit(unit);
  if (!normalized) return "";
  return FRIENDLY_UNIT_LABELS[normalized] ?? normalized;
}

export function isKnownUnit(unit) {
  const normalized = normalizeUnit(unit);
  return Boolean(normalized && FRIENDLY_UNIT_LABELS[normalized]);
}

/**
 * Two fraction digits at or above 1, four below 1 so a stock gallon
 * equivalent like 0.0078125 still reads as 0.0078. Trailing zeros drop.
 */
export function formatQuantityAmount(quantity) {
  const number = Number(quantity);
  if (!Number.isFinite(number)) return null;
  const abs = Math.abs(number);
  const digits = abs === 0 || abs >= 1 ? 2 : 4;
  const fixed = number.toFixed(digits);
  const trimmed = fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return trimmed === "-0" ? "0" : trimmed;
}

function formatRawAmount(quantity) {
  if (quantity == null || quantity === "") return "—";
  const number = Number(quantity);
  if (!Number.isFinite(number)) return String(quantity);
  if (Object.is(number, -0)) return "0";
  if (Number.isInteger(number)) return String(number);
  const fixed = number.toFixed(4);
  const trimmed = fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  return trimmed === "-0" ? "0" : trimmed;
}

function joinAmountUnit(amount, unitLabel) {
  return unitLabel ? `${amount} ${unitLabel}` : String(amount);
}

/** Entered or stock amount, in a friendly unit label. Unknown units stay raw. */
export function formatQuantity(quantity, unit) {
  const rawUnit = normalizeUnit(unit);
  if (rawUnit && !isKnownUnit(rawUnit)) {
    return joinAmountUnit(formatRawAmount(quantity), rawUnit);
  }
  const amount = formatQuantityAmount(quantity);
  if (amount == null) {
    const shown = quantity == null || quantity === "" ? "—" : String(quantity);
    return rawUnit ? joinAmountUnit(shown, friendlyUnitLabel(rawUnit)) : shown;
  }
  return joinAmountUnit(amount, friendlyUnitLabel(rawUnit));
}

/** Parenthetical stock-unit equivalent, e.g. "(≈ 0.0078 gal of stock)". */
export function formatStockNote(stockQty, stockUnit) {
  const unit = normalizeUnit(stockUnit);
  if (!unit || stockQty == null || stockQty === "") return "";
  if (!Number.isFinite(Number(stockQty))) return "";
  return `(≈ ${formatQuantity(stockQty, unit)} of stock)`;
}

function unitsLargestFirst(system) {
  return [...system].sort((a, b) => {
    const ratio = convertQuantity(1, a, b);
    if (ratio == null || ratio === 1) return 0;
    return ratio > 1 ? -1 : 1;
  });
}

/**
 * Largest unit in the same measurement system whose absolute value is at
 * least 1. `ea` never changes. Unknown units pass through.
 */
export function readableQuantity(quantity, unit) {
  const normalized = normalizeUnit(unit);
  const amount = Number(quantity);
  if (!Number.isFinite(amount)) {
    return { quantity, unit: normalized, known: false };
  }
  if (!normalized || !isKnownUnit(normalized)) {
    return { quantity: amount, unit: normalized, known: false };
  }
  if (normalized === "ea") {
    return { quantity: amount, unit: "ea", known: true };
  }

  const system = SYSTEM_BY_UNIT.get(normalized);
  if (!system) {
    return { quantity: amount, unit: normalized, known: true };
  }

  const ranked = unitsLargestFirst(system);
  for (const candidate of ranked) {
    const converted = convertQuantity(amount, normalized, candidate);
    if (converted == null) continue;
    if (Math.abs(converted) + SCALE_EPSILON >= 1) {
      return { quantity: converted, unit: candidate, known: true };
    }
  }

  const smallest = ranked[ranked.length - 1];
  const converted = convertQuantity(amount, normalized, smallest);
  if (converted == null) {
    return { quantity: amount, unit: normalized, known: true };
  }
  return { quantity: converted, unit: smallest, known: true };
}

/** Batch-total amount in a readable unit of the same system. */
export function formatReadableQuantity(quantity, unit) {
  const chosen = readableQuantity(quantity, unit);
  if (!chosen.known) return formatQuantity(quantity, chosen.unit || unit);
  return formatQuantity(chosen.quantity, chosen.unit);
}
