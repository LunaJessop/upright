"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GetItemPhoto } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import ItemPhotoView from "@/components/ItemPhotoView";
import {
  createPhotoPreview,
  messageForPhotoFailure,
  PHOTO_MESSAGES,
  photoViewKey,
} from "@/lib/itemPhoto";

export function useSavedItemPhoto({ itemId, photo, enabled = true }) {
  const { impersonating, user } = useAuth();
  const previewRef = useRef(null);
  if (previewRef.current == null) {
    previewRef.current = createPhotoPreview({
      createUrl: (blob) => URL.createObjectURL(blob),
      revokeUrl: (url) => URL.revokeObjectURL(url),
    });
  }
  const viewerId = [
    user?.id ?? "",
    user?.email ?? "",
    user?.client_name ?? "",
    impersonating?.admin_email ?? "",
  ].join("|");
  const activePhoto = enabled && photo != null ? photo : null;
  const viewKey = photoViewKey({ itemId, photo: activePhoto, viewerId });
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [seenViewKey, setSeenViewKey] = useState(viewKey);
  const [status, setStatus] = useState(() => (viewKey ? "Loading photo…" : ""));
  if (seenViewKey !== viewKey) {
    setSeenViewKey(viewKey);
    setPreviewUrl("");
    setError("");
    setStatus(viewKey ? "Loading photo…" : "");
  }

  useEffect(() => {
    const preview = previewRef.current;
    return () => preview.dispose();
  }, []);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const request = preview.start(viewKey);
    if (!viewKey) return () => request.cancel();
    const controller = new AbortController();
    GetItemPhoto(itemId, { signal: controller.signal })
      .then((blob) => {
        const next = request.accept(blob);
        if (!next) return;
        setPreviewUrl(next);
        setStatus("");
      })
      .catch((err) => {
        if (!request.current || controller.signal.aborted || err?.name === "AbortError") return;
        setPreviewUrl("");
        setStatus("");
        setError(messageForPhotoFailure(err, PHOTO_MESSAGES.load));
      });
    return () => {
      controller.abort();
      request.cancel();
    };
  }, [itemId, viewKey]);

  return {
    previewUrl,
    error,
    status,
    hasPhoto: activePhoto != null,
  };
}

export function SavedItemPhoto({ itemId, itemName, photo }) {
  const loaded = useSavedItemPhoto({ itemId, photo, enabled: true });
  return (
    <ItemPhotoView
      readOnly
      itemName={itemName}
      previewUrl={loaded.previewUrl}
      hasPhoto={loaded.hasPhoto}
      status={loaded.status}
      error={loaded.error}
    />
  );
}
