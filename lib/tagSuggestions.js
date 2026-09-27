function tagName(tag) {
  return String(tag?.name ?? "").trim();
}

function tagKey(tag) {
  if (tag?.id != null) return `id:${tag.id}`;
  return `name:${tagName(tag).toLowerCase()}`;
}

/**
 * Catalog tags matching the query, including tags already on this item.
 * Rename and delete need those rows to stay visible.
 */
export function listTagsForPicker(catalog, query) {
  const q = String(query ?? "").trim().toLowerCase();
  const rows = Array.isArray(catalog) ? catalog : [];
  const matches = [];
  for (const tag of rows) {
    const name = tagName(tag);
    if (!name) continue;
    if (q && !name.toLowerCase().includes(q)) continue;
    matches.push(tag);
  }
  return matches;
}

/** Unselected catalog tags matching the query. An empty query returns all of them. */
export function filterTagSuggestions(catalog, selected, query, limit = 8) {
  const selectedKeys = new Set(
    (Array.isArray(selected) ? selected : []).map(tagKey)
  );
  const q = String(query ?? "").trim().toLowerCase();
  const rows = Array.isArray(catalog) ? catalog : [];
  const matches = [];
  for (const tag of rows) {
    const name = tagName(tag);
    if (!name) continue;
    if (selectedKeys.has(tagKey(tag))) continue;
    if (q && !name.toLowerCase().includes(q)) continue;
    matches.push(tag);
    if (matches.length >= limit) break;
  }
  return matches;
}

export function canCreateTag(catalog, selected, query) {
  const name = String(query ?? "").trim();
  if (!name) return false;
  const q = name.toLowerCase();
  const selectedNames = new Set(
    (Array.isArray(selected) ? selected : []).map((tag) => tagName(tag).toLowerCase())
  );
  if (selectedNames.has(q)) return false;
  const rows = Array.isArray(catalog) ? catalog : [];
  return !rows.some((tag) => tagName(tag).toLowerCase() === q);
}

/** Clamp keyboard highlight movement. -1 means nothing highlighted yet. */
export function moveTagHighlight(current, delta, optionCount) {
  if (!optionCount || optionCount < 1) return -1;
  const start = Number.isInteger(current) && current >= 0 ? current : delta > 0 ? -1 : 0;
  const next = start + delta;
  if (next < 0) return 0;
  if (next >= optionCount) return optionCount - 1;
  return next;
}
