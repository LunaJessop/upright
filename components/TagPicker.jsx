"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CreateTag, DeleteTag, UpdateTag } from "@/app/api/apiHandler";
import { useToast } from "@/components/Toast";
import { controlClass, listClass, rowStripe } from "@/lib/chrome";
import { createdTag } from "@/lib/tagCreate";
import {
  canCreateTag,
  listTagsForPicker,
  moveTagHighlight,
} from "@/lib/tagSuggestions";

const inputClass = `w-full ${controlClass}`;
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
  onTagRenamed,
  onTagDeleted,
  disabled = false,
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const creatingRef = useRef(false);
  const renameRef = useRef(false);
  const toast = useToast();
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const selected = useMemo(() => normalizeSelected(value), [value]);
  const selectedKeys = useMemo(
    () => new Set(selected.map(tagKey)),
    [selected]
  );

  const suggestions = useMemo(
    () => listTagsForPicker(catalog, query),
    [catalog, query]
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

  const createFromQuery = async () => {
    const name = query.trim();
    if (!name || creatingRef.current) return;
    if (exactCatalogMatch) {
      addTag(exactCatalogMatch);
      return;
    }
    creatingRef.current = true;
    setCreating(true);
    try {
      const saved = createdTag(await CreateTag(name), name);
      if (!saved) {
        throw new Error("Could not create tag.");
      }
      addTag(saved);
    } catch (err) {
      toast.error(err?.message || "Could not create tag.");
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
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

  const startRename = (tag) => {
    setDeleteId(null);
    setEditingId(Number(tag.id));
    setEditName(String(tag.name ?? ""));
    setOpen(true);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveRename = async (tag) => {
    const name = editName.trim();
    if (!name) {
      toast.error("Tag name is required");
      return;
    }
    if (name === String(tag.name ?? "")) {
      cancelRename();
      return;
    }
    if (renameRef.current) return;
    renameRef.current = true;
    setSavingRename(true);
    try {
      const saved = createdTag(await UpdateTag(tag.id, name), name);
      if (!saved) throw new Error("Could not rename tag.");
      onTagRenamed?.(saved);
      cancelRename();
    } catch (err) {
      toast.error(err?.message || "Could not rename tag.");
    } finally {
      renameRef.current = false;
      setSavingRename(false);
    }
  };

  const confirmDelete = async (tag) => {
    if (deletingId != null) return;
    setDeletingId(Number(tag.id));
    try {
      await DeleteTag(tag.id);
      onTagDeleted?.({ id: Number(tag.id), name: String(tag.name ?? "") });
      setDeleteId(null);
      if (editingId === Number(tag.id)) cancelRename();
    } catch (err) {
      toast.error(err?.message || "Could not delete tag.");
    } finally {
      setDeletingId(null);
    }
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
              className="inline-flex items-center gap-1 border-brutal-xs border-black bg-nv-cyan/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag.name} from this item`}
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
              onClick={() => void createFromQuery()}
              disabled={query.trim() === "" || creating}
              className="shrink-0 border-brutal-xs border-black bg-nv-violet px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
            >
              {creating ? "Saving…" : canCreate ? "Add new" : "Add"}
            </button>
          </div>

          {showList && (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label="Tags"
              className={`max-h-[min(10rem,45dvh)] overflow-y-auto overscroll-contain border-brutal-xs border-black bg-nv-paper ${listClass}`}
            >
              {suggestions.map((tag, index) => {
                const added = selectedKeys.has(tagKey(tag));
                const isEditing = editingId != null && Number(tag.id) === editingId;
                const isConfirmingDelete =
                  deleteId != null && Number(tag.id) === deleteId;
                return (
                  <li
                    key={tag.id ?? tagKey(tag)}
                    className={rowStripe(index)}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 p-1">
                        <input
                          type="text"
                          value={editName}
                          autoFocus
                          aria-label={`New name for ${tag.name}`}
                          onChange={(event) => setEditName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              event.stopPropagation();
                              void saveRename(tag);
                            }
                            if (event.key === "Escape") {
                              event.preventDefault();
                              event.stopPropagation();
                              cancelRename();
                            }
                          }}
                          className="min-w-0 flex-1 border-brutal-xs border-black bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-nv-violet"
                        />
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => void saveRename(tag)}
                          disabled={savingRename}
                          className="shrink-0 border-brutal-xs border-black bg-nv-violet px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                        >
                          {savingRename ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={cancelRename}
                          disabled={savingRename}
                          className="shrink-0 border-brutal-xs border-black bg-nv-paper px-2 py-1.5 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="space-y-1.5 px-2 py-2">
                        <p className="text-xs font-semibold leading-snug">
                          Remove “{tag.name}” from every item that has it?
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => setDeleteId(null)}
                            disabled={deletingId != null}
                            className="border-brutal-xs border-black bg-nv-paper px-2 py-1.5 text-[10px] font-black uppercase tracking-wide disabled:opacity-40"
                          >
                            Go back
                          </button>
                          <button
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => void confirmDelete(tag)}
                            disabled={deletingId != null}
                            className="border-brutal-xs border-black bg-nv-violet px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-white disabled:opacity-40"
                          >
                            {deletingId === Number(tag.id) ? "Removing…" : "Remove tag"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-stretch">
                        <button
                          type="button"
                          id={`${listId}-opt-${index}`}
                          data-index={index}
                          role="option"
                          aria-selected={activeIndex === index}
                          onMouseDown={(event) => event.preventDefault()}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => addTag(tag)}
                          className={`min-h-8 min-w-0 flex-1 truncate px-2 py-1.5 text-left text-xs font-semibold hover:bg-nv-violet/20 ${
                            activeIndex === index ? "bg-nv-violet/20" : ""
                          }`}
                        >
                          {tag.name}
                          {added ? (
                            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-nv-ink/45">
                              Added
                            </span>
                          ) : null}
                        </button>
                        {tag.id != null && (
                          <>
                            <button
                              type="button"
                              aria-label={`Rename ${tag.name}`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => startRename(tag)}
                              className="min-h-8 shrink-0 border-l border-black/15 px-2 text-[10px] font-black uppercase tracking-wide text-nv-ink hover:bg-nv-cyan/20"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${tag.name}`}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                cancelRename();
                                setDeleteId(Number(tag.id));
                                setOpen(true);
                              }}
                              className="min-h-8 shrink-0 border-l border-black/15 px-2 text-[10px] font-black uppercase tracking-wide text-nv-ink hover:bg-nv-cyan/20"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
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
                    onClick={() => void createFromQuery()}
                    disabled={creating}
                    className={`block w-full px-2 py-1.5 text-left text-xs font-bold text-nv-violet hover:bg-nv-violet/10 disabled:opacity-40 ${
                      activeIndex === suggestions.length ? "bg-nv-violet/10" : ""
                    }`}
                  >
                    {creating ? "Saving…" : `Create “${query.trim()}”`}
                  </button>
                </li>
              )}
              {optionCount === 0 && (
                <li className="px-2 py-1.5 text-xs font-medium text-nv-ink/55">
                  {query.trim() ? "No matching tags" : "No tags yet. Type to create one."}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
