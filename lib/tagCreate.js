/** Tag returned by POST /api/tags, including an existing case-insensitive match. */
export function createdTag(response, fallbackName = "") {
  const source =
    response?.tag && typeof response.tag === "object" ? response.tag : response;
  const name = String(source?.name ?? fallbackName ?? "").trim();
  const rawId = source?.id;
  if (rawId == null || rawId === "" || !name) return null;
  const id = Number(rawId);
  if (!Number.isFinite(id)) return null;
  return { id, name };
}

/** Shared catalog used by every item form on the page. */
export function upsertTagCatalog(catalog, tag) {
  const saved = createdTag(tag, tag?.name);
  const rows = Array.isArray(catalog) ? [...catalog] : [];
  if (!saved) return rows;
  const index = rows.findIndex((row) => Number(row?.id) === saved.id);
  if (index >= 0) {
    rows[index] = { ...rows[index], id: saved.id, name: saved.name };
    return rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }
  rows.push(saved);
  return rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

/**
 * Item create/update should reference saved tags by id.
 * A name with no id would make the server create the tag again.
 */
export function tagsForSave(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  const seen = new Set();
  for (const tag of tags) {
    const saved = createdTag(tag, tag?.name);
    if (!saved || seen.has(saved.id)) continue;
    seen.add(saved.id);
    out.push(saved);
  }
  return out;
}

function sameTagId(tag, id) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return false;
  return Number(tag?.id) === numericId;
}

/** New name for one tag id. A case-only change counts. A blank name is ignored. */
export function renameTagInList(tags, id, name) {
  if (!Array.isArray(tags)) return [];
  const nextName = String(name ?? "").trim();
  if (!nextName || !Number.isFinite(Number(id))) return tags.slice();
  return tags.map((tag) =>
    sameTagId(tag, id) ? { ...tag, id: Number(id), name: nextName } : tag
  );
}

/** Drop one tag id from a catalog or from the tags on a single item. */
export function removeTagById(tags, id) {
  if (!Array.isArray(tags)) return [];
  if (!Number.isFinite(Number(id))) return tags.slice();
  return tags.filter((tag) => !sameTagId(tag, id));
}

function mapItemTags(items, mapTags) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item || !Array.isArray(item.tags)) return item;
    return { ...item, tags: mapTags(item.tags) };
  });
}

/** Rename a tag on every queued item that already has it. */
export function renameTagOnItems(items, id, name) {
  return mapItemTags(items, (tags) => renameTagInList(tags, id, name));
}

/** Remove a tag from every queued item that had it. */
export function removeTagFromItems(items, id) {
  return mapItemTags(items, (tags) => removeTagById(tags, id));
}
