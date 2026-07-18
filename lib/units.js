/**
 * Unit families + conversion to a base unit within the same family.
 * Cross-family conversion is not supported (no density/etc.).
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
  return Boolean(a && b && a === b);
}

/**
 * Convert quantity from one unit to another within the same family.
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
  if (!fromMeta || !toMeta || fromMeta.family !== toMeta.family) {
    return null;
  }
  if (toMeta.toBase === 0) return null;
  return (qty * fromMeta.toBase) / toMeta.toBase;
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

/** Units in the same family as `unit` (including itself). */
export function compatibleUnits(unit, allOptions) {
  const family = getUnitFamily(unit);
  if (!family) {
    const normalized = normalizeUnit(unit);
    return normalized
      ? allOptions.filter((opt) => opt.value === normalized)
      : [];
  }
  return allOptions.filter(
    (opt) => getUnitFamily(opt.value) === family
  );
}
