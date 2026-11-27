import { formatQty } from "./itemDetail.js";

/** Rows requested per history page. The card scrolls; this stays under the server cap. */
export const TRANSACTION_PAGE_LIMIT = 20;

export const NOTE_MAX = 500;

/** Manual reasons the stock ledger accepts for stock leaving the shelf. */
export const OUT_REASONS = Object.freeze([
  { value: "sold", label: "Sell" },
  { value: "gifted", label: "Gifted" },
  { value: "donated", label: "Donated" },
  { value: "lost", label: "Lost" },
  { value: "damaged", label: "Damaged" },
  { value: "stock_check", label: "Stock check" },
  { value: "other", label: "Other" },
]);

/** Manual reasons the stock ledger accepts for stock coming in. */
export const IN_REASONS = Object.freeze([
  { value: "returned", label: "Return" },
  { value: "found", label: "Found" },
  { value: "stock_check", label: "Stock check" },
  { value: "other", label: "Other" },
]);

const REASON_LABELS = {
  sold: "Sell",
  gifted: "Gifted",
  donated: "Donated",
  lost: "Lost",
  damaged: "Damaged",
  stock_check: "Stock check",
  other: "Other",
  returned: "Return",
  found: "Found",
  production: "Production",
  materials_used: "Materials used",
  received: "Received",
  adjustment: "Adjustment",
  unit_change: "Unit change",
};

const DECIMAL = /^-?\d+(\.\d+)?$/;
const UNSIGNED_DECIMAL = /^\d+(\.\d+)?$/;

export function reasonsForDirection(direction) {
  return direction === "in" ? IN_REASONS : OUT_REASONS;
}

export function reasonForDirection(direction, current) {
  const options = reasonsForDirection(direction);
  if (options.some((option) => option.value === current)) return current;
  return options[0]?.value ?? "";
}

export function reasonLabel(reason) {
  if (REASON_LABELS[reason]) return REASON_LABELS[reason];
  if (reason == null || reason === "") return "—";
  return String(reason)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function todayInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function emptyTransactionDraft(occurredOn = todayInputValue()) {
  return {
    direction: "out",
    reason: "sold",
    quantity: "",
    unitPrice: "",
    occurredOn,
    note: "",
  };
}

function canonicalDecimal(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    if (Object.is(value, -0)) return "0";
    const text = String(value);
    if (DECIMAL.test(text)) return text;
    const fixed = value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
    return DECIMAL.test(fixed) ? fixed : null;
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  return DECIMAL.test(text) ? text : null;
}

function splitDecimal(text) {
  const negative = text.startsWith("-");
  const body = negative ? text.slice(1) : text;
  const [whole, frac = ""] = body.split(".");
  const digits = `${whole}${frac}`.replace(/^0+(?=\d)/, "") || "0";
  const int = Number(digits);
  if (!Number.isSafeInteger(int)) return null;
  return { int: negative ? -int : int, places: frac.length };
}

/** Add two stock amounts without binary float error. Returns null when either side is not a decimal. */
export function addStock(onHand, delta) {
  const leftText = canonicalDecimal(onHand);
  const rightText = canonicalDecimal(delta);
  if (leftText == null || rightText == null) return null;
  const left = splitDecimal(leftText);
  const right = splitDecimal(rightText);
  if (!left || !right) return null;
  const places = Math.max(left.places, right.places);
  if (places > 8) return null;
  const sum =
    left.int * 10 ** (places - left.places) + right.int * 10 ** (places - right.places);
  if (!Number.isSafeInteger(sum)) return null;
  const negative = sum < 0;
  const digits = String(Math.abs(sum)).padStart(places + 1, "0");
  const whole = places === 0 ? digits : digits.slice(0, -places);
  const frac = places === 0 ? "" : digits.slice(-places).replace(/0+$/, "");
  const text = `${negative ? "-" : ""}${whole || "0"}${frac ? `.${frac}` : ""}`;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function negateDecimal(text) {
  if (text.startsWith("-")) return text.slice(1);
  if (Number(text) === 0) return "0";
  return `-${text}`;
}

/**
 * On-hand quantity after a typed amount. Null when the amount is blank or not a positive decimal.
 */
export function projectOnHand({ onHand, direction, quantityRaw }) {
  const quantityText = String(quantityRaw ?? "").trim();
  if (!UNSIGNED_DECIMAL.test(quantityText) || Number(quantityText) === 0) return null;
  const signed = direction === "out" ? negateDecimal(quantityText) : quantityText;
  const resulting = addStock(onHand ?? 0, signed);
  if (resulting == null) return null;
  return { resulting, overOnHand: resulting < 0 };
}

export function formatOnHandAfter(resulting, unit) {
  if (!Number.isFinite(resulting)) return "";
  const sign = resulting < 0 ? "−" : "";
  const unitSuffix = unit ? ` ${unit}` : "";
  return `On hand after: ${sign}${formatQty(Math.abs(resulting))}${unitSuffix}`;
}

function failure(code, error, extra = {}) {
  return {
    ok: false,
    code,
    error,
    resulting: extra.resulting ?? null,
    overOnHand: Boolean(extra.overOnHand),
    payload: null,
  };
}

/**
 * Check a manual stock change before it is sent.
 * `today` is YYYY-MM-DD in the shop's local calendar.
 */
export function prepareManualTransaction({
  direction,
  reason,
  quantityRaw,
  unitPriceRaw,
  noteRaw,
  occurredOn,
  onHand,
  today,
}) {
  if (direction !== "in" && direction !== "out") {
    return failure("direction", "Direction must be in or out.");
  }
  const allowed = reasonsForDirection(direction);
  if (!allowed.some((option) => option.value === reason)) {
    return failure("reason", "That reason doesn't match this stock change.");
  }

  const quantityText = String(quantityRaw ?? "").trim();
  if (!UNSIGNED_DECIMAL.test(quantityText) || Number(quantityText) <= 0) {
    return failure("quantity", "Quantity must be greater than zero.");
  }
  if ((quantityText.split(".")[1] ?? "").length > 8) {
    return failure("quantity", "Use 8 decimal places or fewer.");
  }

  const projection = projectOnHand({ onHand, direction, quantityRaw: quantityText });
  if (!projection) {
    return failure("quantity", "Quantity must be greater than zero.");
  }
  if (projection.overOnHand) {
    return failure("over", "That would take stock below zero.", {
      resulting: projection.resulting,
      overOnHand: true,
    });
  }

  const priceText = String(unitPriceRaw ?? "").trim();
  let unitPrice = null;
  if (priceText !== "") {
    if (!UNSIGNED_DECIMAL.test(priceText)) {
      return failure("price", "Price must be zero or more.", {
        resulting: projection.resulting,
      });
    }
    unitPrice = Number(priceText);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return failure("price", "Price must be zero or more.", {
        resulting: projection.resulting,
      });
    }
  }

  const note = String(noteRaw ?? "").trim();
  if (note.length > NOTE_MAX) {
    return failure("note", `Note must be ${NOTE_MAX} characters or fewer.`, {
      resulting: projection.resulting,
    });
  }

  const date = String(occurredOn ?? "").trim();
  const todayValue = today ?? todayInputValue();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return failure("date", "Date must be YYYY-MM-DD.", {
      resulting: projection.resulting,
    });
  }
  if (date > todayValue) {
    return failure("date", "Date can't be in the future.", {
      resulting: projection.resulting,
    });
  }

  return {
    ok: true,
    code: null,
    error: "",
    resulting: projection.resulting,
    overOnHand: false,
    payload: {
      direction,
      reason,
      quantity: Number(quantityText),
      unit_price: unitPrice,
      note: note || null,
      occurred_on: date,
    },
  };
}

export function signedQuantityText(row) {
  const change = Number(row?.quantity_change);
  const fallback = row?.direction === "out" ? -Number(row?.quantity) : Number(row?.quantity);
  const amount = Number.isFinite(change) ? change : fallback;
  if (!Number.isFinite(amount)) return "—";
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  const unit = row?.unit_of_measure ? ` ${row.unit_of_measure}` : "";
  return `${sign}${formatQty(Math.abs(amount))}${unit}`;
}

export function mergeTransactionPages(current, incoming) {
  const seen = new Set((current ?? []).map((row) => row?.id));
  const extra = (incoming ?? []).filter((row) => row && !seen.has(row.id));
  return [...(current ?? []), ...extra];
}
