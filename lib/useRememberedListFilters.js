"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  listFilterStorageKey,
  parseListFilterRaw,
  readListFilterRaw,
  removeStoredListFilters,
  sameListFilters,
  subscribeListFilters,
  writeStoredListFilters,
} from "@/lib/listFilters";
import { preferenceOwnerId } from "@/lib/viewAs";

function subscribeClient() {
  return () => {};
}

function clientSnapshot() {
  return true;
}

function serverSnapshot() {
  return false;
}

/**
 * Remembers a list's filters for the signed-in person.
 * Viewing as someone else keeps the choices on screen only.
 * `empty` and `sanitize` must be stable module values.
 * `refine` drops choices that are no longer available, such as a deleted tag.
 */
export function useRememberedListFilters({
  user,
  impersonating,
  baseKey,
  empty,
  sanitize,
  refine,
}) {
  const storageKey = listFilterStorageKey(baseKey, preferenceOwnerId(user, impersonating));
  const key = storageKey ?? "";
  const ready = useSyncExternalStore(subscribeClient, clientSnapshot, serverSnapshot);
  const raw = useSyncExternalStore(
    subscribeListFilters,
    () => readListFilterRaw(storageKey),
    () => ""
  );
  const [draft, setDraft] = useState(null);
  const [draftKey, setDraftKey] = useState(key);
  const keyChanged = draftKey !== key;
  const stored = sanitize(parseListFilterRaw(key ? raw : ""));
  const base = keyChanged || draft == null ? stored : draft;
  const filters = refine ? refine(base) : base;
  if (keyChanged) {
    setDraftKey(key);
    setDraft(null);
  } else if (!sameListFilters(filters, base)) {
    setDraft(filters);
  }

  useEffect(() => {
    if (!ready || !storageKey || draft == null) return;
    if (sameListFilters(draft, empty)) removeStoredListFilters(storageKey);
    else writeStoredListFilters(storageKey, draft);
  }, [ready, storageKey, draft, empty]);

  function update(partial) {
    setDraft(sanitize({ ...filters, ...partial }));
  }

  function reset() {
    setDraft(sanitize(empty));
  }

  return { filters, update, reset, ready, storageKey };
}
