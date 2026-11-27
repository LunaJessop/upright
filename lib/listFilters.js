export const ITEM_LIST_FILTER_KEY = "upright_items_list_filters";
export const BATCH_LIST_FILTER_KEY = "upright_batches_list_filters";

const QUERY_LIMIT = 200;
const TAG_LIMIT = 64;

export const ITEM_LIST_DEFAULTS = Object.freeze({
  type: "all",
  status: "all",
  tag: "",
  query: "",
});

export const BATCH_LIST_DEFAULTS = Object.freeze({
  status: "queue",
  query: "",
});

export const BATCH_STATUS_OPTIONS = Object.freeze([
  Object.freeze({ value: "queue", label: "Queue" }),
  Object.freeze({ value: "pending", label: "Pending" }),
  Object.freeze({ value: "in_progress", label: "In progress" }),
  Object.freeze({ value: "complete", label: "Complete" }),
  Object.freeze({ value: "cancelled", label: "Cancelled" }),
  Object.freeze({ value: "all", label: "All" }),
]);

const ITEM_TYPES = new Set(["all", "make", "buy"]);
const ITEM_STATUSES = new Set(["all", "active", "inactive"]);
const BATCH_STATUSES = new Set(BATCH_STATUS_OPTIONS.map((option) => option.value));

export function listFilterStorageKey(baseKey, userId) {
  if (baseKey == null || String(baseKey).trim() === "") return null;
  if (userId == null || String(userId).trim() === "") return null;
  return `${baseKey}:${String(userId)}`;
}

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function readStoredListFilters(key, storage) {
  const store = resolveStorage(storage);
  if (!store || !key) return null;
  try {
    const raw = store.getItem(key);
    return parseListFilterRaw(raw);
  } catch {
    return null;
  }
}

export function writeStoredListFilters(key, value, storage) {
  const store = resolveStorage(storage);
  if (!store || !key) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStoredListFilters(key, storage) {
  const store = resolveStorage(storage);
  if (!store || !key) return false;
  try {
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Raw string for useSyncExternalStore. Empty when missing or unreadable. */
export function readListFilterRaw(key) {
  if (!key) return "";
  try {
    if (typeof localStorage === "undefined") return "";
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function parseListFilterRaw(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function subscribeListFilters(onChange) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function sameListFilters(a, b) {
  if (!a || !b) return false;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function cleanQuery(value) {
  if (typeof value !== "string") return "";
  return value.slice(0, QUERY_LIMIT);
}

export function sanitizeItemListFilters(stored, { tagIds } = {}) {
  const next = { ...ITEM_LIST_DEFAULTS };
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return next;
  if (ITEM_TYPES.has(stored.type)) next.type = stored.type;
  if (ITEM_STATUSES.has(stored.status)) next.status = stored.status;
  next.query = cleanQuery(stored.query);
  const tag = stored.tag == null ? "" : String(stored.tag).trim();
  if (!tag || tag.length > TAG_LIMIT) return next;
  if (tagIds == null) {
    next.tag = tag;
    return next;
  }
  if (tagIds.some((id) => String(id) === tag)) next.tag = tag;
  return next;
}

export function itemListFiltersActive(filters) {
  if (!filters) return false;
  return (
    filters.type !== ITEM_LIST_DEFAULTS.type ||
    filters.status !== ITEM_LIST_DEFAULTS.status ||
    String(filters.tag || "") !== "" ||
    String(filters.query || "").trim() !== ""
  );
}

export function sanitizeBatchListFilters(stored) {
  const next = { ...BATCH_LIST_DEFAULTS };
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return next;
  if (BATCH_STATUSES.has(stored.status)) next.status = stored.status;
  next.query = cleanQuery(stored.query);
  return next;
}

export function batchListFiltersActive(filters) {
  if (!filters) return false;
  return (
    filters.status !== BATCH_LIST_DEFAULTS.status ||
    String(filters.query || "").trim() !== ""
  );
}

export function batchMatchesListFilter(batch, filters) {
  const status = batch?.status ? String(batch.status) : "planned";
  const selected = BATCH_STATUSES.has(filters?.status)
    ? filters.status
    : BATCH_LIST_DEFAULTS.status;
  if (selected === "queue") {
    if (status === "complete" || status === "cancelled") return false;
  } else if (selected === "pending") {
    if (status !== "planned") return false;
  } else if (selected !== "all" && status !== selected) {
    return false;
  }
  const query = String(filters?.query || "").trim().toLowerCase();
  if (!query) return true;
  const haystack = [batch?.sku, batch?.item_name]
    .filter((part) => part != null && String(part) !== "")
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}
