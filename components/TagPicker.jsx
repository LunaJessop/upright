"use client";

import { useMemo, useState } from "react";

const inputClass =
  "w-full border-brutal border-black bg-nv-paper px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet";
const labelClass = "text-[10px] font-black uppercase tracking-wide text-nv-ink/55";

function tagKey(tag) {
  if (tag?.id != null) return `id:${tag.id}`;
  return `name:${String(tag?.name ?? "").trim().toLowerCase()}`;
}

function normalizeSelected(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const tag of tags) {
    const name = String(tag?.name ?? "").trim();
    if (!name) continue;
    const entry = {
      ...(tag.id != null ? { id: Number(tag.id) } : {}),
      name,
    };
    const key = tagKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

/**
 * Multi-select tags with create-on-type.
 * value: [{ id?, name }]
 * catalog: [{ id, name }] from GET /api/tags
 */
export default function TagPicker({
  value = [],
  onChange,
  catalog = [],
  onCatalogAdd,
  disabled = false,
  className = "",
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => normalizeSelected(value), [value]);
  const selectedKeys = useMemo(
    () => new Set(selected.map(tagKey)),
    [selected]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (Array.isArray(catalog) ? catalog : [])
      .filter((tag) => {
        const name = String(tag.name ?? "").trim();
        if (!name) return false;
        if (selectedKeys.has(tagKey(tag))) return false;
        if (!q) return true;
        return name.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [catalog, query, selectedKeys]);

  const exactCatalogMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (Array.isArray(catalog) ? catalog : []).find(
      (tag) => String(tag.name ?? "").trim().toLowerCase() === q
    );
  }, [catalog, query]);

  const canCreate =
    query.trim() !== "" &&
    !exactCatalogMatch &&
    !selectedKeys.has(`name:${query.trim().toLowerCase()}`);

  const addTag = (tag) => {
    const name = String(tag?.name ?? "").trim();
    if (!name) return;
    const entry = {
      ...(tag.id != null ? { id: Number(tag.id) } : {}),
      name,
    };
    if (selectedKeys.has(tagKey(entry))) {
      setQuery("");
      return;
    }
    onChange([...selected, entry]);
    if (entry.id != null) {
      onCatalogAdd?.(entry);
    }
    setQuery("");
  };

  const createFromQuery = () => {
    const name = query.trim();
    if (!name) return;
    if (exactCatalogMatch) {
      addTag(exactCatalogMatch);
      return;
    }
    addTag({ name });
  };

  const removeTag = (tag) => {
    const key = tagKey(tag);
    onChange(selected.filter((entry) => tagKey(entry) !== key));
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <span className={labelClass}>Tags</span>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <span
              key={tagKey(tag)}
              className="inline-flex items-center gap-1 border-brutal border-black bg-nv-cyan/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag.name}`}
                  className="font-black leading-none"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="space-y-1">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (suggestions[0]) addTag(suggestions[0]);
                  else createFromQuery();
                }
              }}
              placeholder="Search or create a tag"
              className={inputClass}
            />
            <button
              type="button"
              onClick={createFromQuery}
              disabled={query.trim() === ""}
              className="shrink-0 border-brutal border-black bg-nv-violet px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
            >
              {canCreate ? "Add new" : "Add"}
            </button>
          </div>

          {query.trim() !== "" && (suggestions.length > 0 || canCreate) && (
            <ul className="max-h-40 overflow-y-auto border-brutal border-black bg-nv-paper">
              {suggestions.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => addTag(tag)}
                    className="block w-full px-2 py-1.5 text-left text-xs font-semibold hover:bg-nv-cyan/20"
                  >
                    {tag.name}
                  </button>
                </li>
              ))}
              {canCreate && (
                <li>
                  <button
                    type="button"
                    onClick={createFromQuery}
                    className="block w-full border-t border-black/10 px-2 py-1.5 text-left text-xs font-bold text-nv-violet hover:bg-nv-violet/10"
                  >
                    Create “{query.trim()}”
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
