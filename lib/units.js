/**
 * Unit families + conversion.
 *
 * Within one family, toBase is unchanged (oz, fl oz, mg, mL, and so on).
 * Weight converts between metric and imperial, and volume does too.
 * Weight never converts to volume: there is no density. Count stays
 * separate. Length and area already share one family each.
 *
 * Bridges match upright-server lib/units.js, using exact US definitions:
 * - 1 lb = 0.45359237 kg, so 1 oz = 28.349523125 g
 * - 1 gal = 3785.411784 mL, so 1 fl oz = 29.5735295625 mL
 */

const UNIT_TO_BASE = {
  // Count
  ea: { family: "count", toBase: 1 },

  // Weight — imperial (base: oz)
  oz: { family: "weight_imperial", toBase: 1 },
  lb: { family: "weight_imperial", toBase: 16 },
  short_ton: { family: "weight_imperial", toBase: 32000 },

  // Weight — metric (base: mg)
  mg: { family: "weight_metric", toBase: 1 },
  g: { family: "weight_metric", toBase: 1000 },
  kg: { family: "weight_metric", toBase: 1_000_000 },
  t: { family: "weight_metric", toBase: 1_000_000_000 },

  // Length (base: mm)
  mm: { family: "length", toBase: 1 },
  cm: { family: "length", toBase: 10 },
  m: { family: "length", toBase: 1000 },
  ft: { family: "length", toBase: 304.8 },
  yd: { family: "length", toBase: 914.4 },

  // Area (base: sq_mm)
  sq_mm: { family: "area", toBase: 1 },
  sq_cm: { family: "area", toBase: 100 },
  sq_m: { family: "area", toBase: 1_000_000 },
  sq_ft: { family: "area", toBase: 92903.04 },
  sq_yd: { family: "area", toBase: 836127.36 },

  // Volume — imperial (base: fl_oz)
  tsp: { family: "volume_imperial", toBase: 1 / 6 },
  tbsp: { family: "volume_imperial", toBase: 0.5 },
  fl_oz: { family: "volume_imperial", toBase: 1 },
  cup: { family: "volume_imperial", toBase: 8 },
  pt: { family: "volume_imperial", toBase: 16 },
  qt: { family: "volume_imperial", toBase: 32 },
  gal: { family: "volume_imperial", toBase: 128 },

  // Volume — metric (base: mL)
  mL: { family: "volume_metric", toBase: 1 },
  cL: { family: "volume_metric", toBase: 10 },
  dL: { family: "volume_metric", toBase: 100 },
  L: { family: "volume_metric", toBase: 1000 },
};

/** 1 avoirdupois ounce in milligrams. 1 lb = 0.45359237 kg exactly. */
const MG_PER_OZ = 28.349523125 * 1000;

/** 1 US fluid ounce in milliliters. 1 gal = 3785.411784 mL. */
const ML_PER_FL_OZ = 3785.411784 / 128;

function unitDimension(family) {
  if (family === "weight_metric" || family === "weight_imperial") return "weight";
  if (family === "volume_metric" || family === "volume_imperial") return "volume";
  return family;
}

/** Quantity in mg (weight) or mL (volume), or the family's own base. */
function toDimensionAmount(qty, meta) {
  if (meta.family === "weight_imperial") return qty * meta.toBase * MG_PER_OZ;
  if (meta.family === "volume_imperial") return qty * meta.toBase * ML_PER_FL_OZ;
  return qty * meta.toBase;
}

function fromDimensionAmount(amount, meta) {
  if (meta.family === "weight_imperial") return amount / (meta.toBase * MG_PER_OZ);
  if (meta.family === "volume_imperial") return amount / (meta.toBase * ML_PER_FL_OZ);
  if (meta.toBase === 0) return null;
  return amount / meta.toBase;
}

export function normalizeUnit(unit) {
  if (unit == null) return "";
  return String(unit).trim();
}

export function getUnitFamily(unit) {
  const meta = UNIT_TO_BASE[normalizeUnit(unit)];
  return meta?.family ?? null;
}

export function unitsAreCompatible(fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to) return false;
  if (from === to) return true;
  const a = getUnitFamily(from);
  const b = getUnitFamily(to);
  if (!a || !b) return false;
  return unitDimension(a) === unitDimension(b);
}

/**
 * Convert quantity between units of the same dimension.
 * Weight crosses metric and imperial. Volume does too.
 * Weight never converts to volume, and count stays separate.
 * Returns null if incompatible or unknown.
 */
export function convertQuantity(quantity, fromUnit, toUnit) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty)) return null;

  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to) return null;
  if (from === to) return qty;

  const fromMeta = UNIT_TO_BASE[from];
  const toMeta = UNIT_TO_BASE[to];
  if (!fromMeta || !toMeta) return null;
  if (unitDimension(fromMeta.family) !== unitDimension(toMeta.family)) {
    return null;
  }
  // Same family keeps the original ratios exact (16 oz/lb, 128 fl oz/gal, 6 tsp/fl oz).
  if (fromMeta.family === toMeta.family) {
    if (toMeta.toBase === 0) return null;
    return (qty * fromMeta.toBase) / toMeta.toBase;
  }

  const converted = fromDimensionAmount(toDimensionAmount(qty, fromMeta), toMeta);
  return Number.isFinite(converted) ? converted : null;
}

/**
 * Convert a BOM line quantity into the component's stockkeeping UOM.
 * If line has no UOM, treat quantity as already in stock UOM.
 */
export function bomQuantityInStockUnit(lineQuantity, lineUnit, stockUnit) {
  const qty = Number(lineQuantity);
  if (!Number.isFinite(qty)) return null;

  const stock = normalizeUnit(stockUnit);
  const line = normalizeUnit(lineUnit);

  if (!line || !stock || line === stock) return qty;

  const converted = convertQuantity(qty, line, stock);
  return converted;
}

/**
 * Stock units of a component consumed when `parentMultiplier` stock units
 * of its parent are made.
 *
 * Child recipe lines are defined per 1 stock unit of this component, so
 * nested explosion must scale by the converted quantity. A line of 1 lb
 * against an oz-stocked make item is 16 stock units, not 1.
 * Returns null when the line quantity cannot be converted.
 */
export function componentStockMultiplier(
  lineQuantity,
  lineUnit,
  stockUnit,
  parentMultiplier = 1
) {
  const parent = Number(parentMultiplier);
  const scale = Number.isFinite(parent) ? parent : 1;
  const stockQty = bomQuantityInStockUnit(lineQuantity, lineUnit, stockUnit);
  if (stockQty == null) return null;
  return stockQty * scale;
}

/** Units of the same dimension as `unit` (including itself). */
export function compatibleUnits(unit, allOptions) {
  const family = getUnitFamily(unit);
  const options = Array.isArray(allOptions) ? allOptions : [];
  if (!family) {
    const normalized = normalizeUnit(unit);
    return normalized
      ? options.filter((opt) => opt.value === normalized)
      : [];
  }
  const dimension = unitDimension(family);
  return options.filter((opt) => {
    const other = getUnitFamily(opt.value);
    return Boolean(other && unitDimension(other) === dimension);
  });
}
