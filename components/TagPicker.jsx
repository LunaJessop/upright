"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  canCreateTag,
  filterTagSuggestions,
  moveTagHighlight,
} from "@/lib/tagSuggestions";

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
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const selected = useMemo(() => normalizeSelected(value), [value]);
  const selectedKeys = useMemo(
    () => new Set(selected.map(tagKey)),
    [selected]
  );

  const suggestions = useMemo(
    () => filterTagSuggestions(catalog, selected, query),
    [catalog, selected, query]
  );

  const exactCatalogMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return (Array.isArray(catalog) ? catalog : []).find(
      (tag) => String(tag.name ?? "").trim().toLowerCase() === q
    );
  }, [catalog, query]);

  const canCreate = canCreateTag(catalog, selected, query);
  const optionCount = suggestions.length + (canCreate ? 1 : 0);

  const closeList = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const addTag = (tag) => {
    const name = String(tag?.name ?? "").trim();
    if (!name) return;
    const entry = {
      ...(tag.id != null ? { id: Number(tag.id) } : {}),
      name,
    };
    if (selectedKeys.has(tagKey(entry))) {
      setQuery("");
      setActiveIndex(-1);
      return;
    }
    onChange([...selected, entry]);
    if (entry.id != null) {
      onCatalogAdd?.(entry);
    }
    setQuery("");
    setActiveIndex(-1);
    setOpen(true);
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

  const pickActive = () => {
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      addTag(suggestions[activeIndex]);
      return;
    }
    if (canCreate && activeIndex === suggestions.length) {
      createFromQuery();
      return;
    }
    if (suggestions[0]) addTag(suggestions[0]);
    else createFromQuery();
  };

  const removeTag = (tag) => {
    const key = tagKey(tag);
    onChange(selected.filter((entry) => tagKey(entry) !== key));
  };

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        closeList();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const option = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    option?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const showList = open && (optionCount > 0 || query.trim() === "");

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      <span className={labelClass} id={`${listId}-label`}>
        Tags
      </span>

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
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-labelledby={`${listId}-label`}
              aria-activedescendant={
                activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
              }
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (next && containerRef.current?.contains(next)) return;
                closeList();
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                  setActiveIndex((current) => moveTagHighlight(current, 1, optionCount));
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setOpen(true);
                  setActiveIndex((current) => moveTagHighlight(current, -1, optionCount));
                  return;
                }
                if (e.key === "Escape") {
                  if (!open) return;
                  e.preventDefault();
                  closeList();
                  return;
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  pickActive();
                }
              }}
              placeholder="Search or create a tag"
              className={inputClass}
            />
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={createFromQuery}
              disabled={query.trim() === ""}
              className="shrink-0 border-brutal border-black bg-nv-violet px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
            >
              {canCreate ? "Add new" : "Add"}
            </button>
          </div>

          {showList && (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Tags"
              className="max-h-[min(10rem,45dvh)] overflow-y-auto overscroll-contain border-brutal border-black bg-nv-paper"
            >
              {suggestions.map((tag, index) => (
                <li key={tag.id ?? tagKey(tag)}>
                  <button
                    type="button"
                    id={`${listId}-opt-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => addTag(tag)}
                    className={`block w-full px-2 py-1.5 text-left text-xs font-semibold hover:bg-nv-cyan/20 ${
                      activeIndex === index ? "bg-nv-cyan/30" : ""
                    }`}
                  >
                    {tag.name}
                  </button>
                </li>
              ))}
              {canCreate && (
                <li>
                  <button
                    type="button"
                    id={`${listId}-opt-${suggestions.length}`}
                    data-index={suggestions.length}
                    role="option"
                    aria-selected={activeIndex === suggestions.length}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(suggestions.length)}
                    onClick={createFromQuery}
                    className={`block w-full border-t border-black/10 px-2 py-1.5 text-left text-xs font-bold text-nv-violet hover:bg-nv-violet/10 ${
                      activeIndex === suggestions.length ? "bg-nv-violet/10" : ""
                    }`}
                  >
                    Create “{query.trim()}”
                  </button>
                </li>
              )}
              {optionCount === 0 && (
                <li className="px-2 py-1.5 text-xs font-medium text-nv-ink/55">
                  {query.trim()
                    ? "No matching tags"
                    : (Array.isArray(catalog) ? catalog : []).some((tag) =>
                          String(tag?.name ?? "").trim()
                        )
                      ? "All tags are already added"
                      : "No tags yet. Type to create one."}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
