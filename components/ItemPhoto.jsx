"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DeleteItemPhoto,
  GetItemPhoto,
  UploadItemPhoto,
} from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import ItemPhotoView from "@/components/ItemPhotoView";
import { useToast } from "@/components/Toast";
import {
  canUploadItemPhoto,
  compressItemPhoto,
  createPhotoPreview,
  messageForPhotoFailure,
  PHOTO_MESSAGES,
  photoMetadata,
  photoViewKey,
} from "@/lib/itemPhoto";

export default function ItemPhoto({ itemId, itemName, photo, canWrite, onPhotoChange }) {
  const { impersonating, user } = useAuth();
  const toast = useToast();
  const previewRef = useRef(null);
  const viewRef = useRef({ itemId, onPhotoChange });
  const opRef = useRef(0);
  if (!previewRef.current) {
    previewRef.current = createPhotoPreview({
      createUrl: (blob) => URL.createObjectURL(blob),
      revokeUrl: (url) => URL.revokeObjectURL(url),
    });
  }
  viewRef.current = { itemId, onPhotoChange };
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [revision, setRevision] = useState(0);
  const hasPhoto = photo != null;
  const allowWrite = Boolean(canWrite);
  const viewerId = [
    user?.id ?? "",
    user?.email ?? "",
    user?.client_name ?? "",
    impersonating?.admin_email ?? "",
  ].join("|");
  const viewKey = photoViewKey({ itemId, photo, revision, viewerId });

  useEffect(() => {
    const preview = previewRef.current;
    return () => preview.dispose();
  }, []);

  useEffect(() => {
    opRef.current += 1;
    setBusy(false);
    setConfirmingRemove(false);
    setError("");
  }, [itemId, viewerId]);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const request = preview.start(viewKey);
    setPreviewUrl("");
    if (!viewKey) {
      setStatus("");
      return () => request.cancel();
    }
    setStatus("Loading photo…");
    setError("");
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

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy || impersonating || !allowWrite || !canUploadItemPhoto(itemId)) return;
    const op = opRef.current + 1;
    opRef.current = op;
    const startedId = itemId;
    setBusy(true);
    setError("");
    setConfirmingRemove(false);
    setStatus("Preparing photo…");
    try {
      const prepared = await compressItemPhoto(file);
      if (opRef.current !== op || viewRef.current.itemId !== startedId) return;
      setStatus("Saving photo…");
      const saved = await UploadItemPhoto(startedId, prepared);
      if (opRef.current !== op || viewRef.current.itemId !== startedId) return;
      viewRef.current.onPhotoChange?.(photoMetadata(saved?.photo));
      setRevision((value) => value + 1);
      setStatus("");
      toast.success("Photo saved.");
    } catch (err) {
      if (opRef.current !== op || viewRef.current.itemId !== startedId) return;
      const message = messageForPhotoFailure(err);
      setStatus("");
      setError(message);
      toast.error(message);
    } finally {
      if (opRef.current === op) setBusy(false);
    }
  }

  async function removePhoto() {
    if (busy || impersonating || !allowWrite || !canUploadItemPhoto(itemId)) return;
    const op = opRef.current + 1;
    opRef.current = op;
    const startedId = itemId;
    setBusy(true);
    setError("");
    setStatus("Removing photo…");
    try {
      await DeleteItemPhoto(startedId);
      if (opRef.current !== op || viewRef.current.itemId !== startedId) return;
      viewRef.current.onPhotoChange?.(null);
      setRevision((value) => value + 1);
      setConfirmingRemove(false);
      setStatus("");
      toast.success("Photo removed.");
    } catch (err) {
      if (opRef.current !== op || viewRef.current.itemId !== startedId) return;
      const message = messageForPhotoFailure(err, PHOTO_MESSAGES.remove);
      setStatus("");
      setError(message);
      toast.error(message);
    } finally {
      if (opRef.current === op) setBusy(false);
    }
  }

  return (
    <ItemPhotoView
      itemName={itemName}
      previewUrl={previewUrl}
      hasPhoto={hasPhoto}
      canWrite={allowWrite}
      busy={busy}
      status={status}
      error={error}
      confirmingRemove={confirmingRemove}
      savedOnly={!canUploadItemPhoto(itemId)}
      onCancelRemove={() => setConfirmingRemove(false)}
      onConfirmRemove={() => void removePhoto()}
      onAskRemove={() => setConfirmingRemove(true)}
      onFile={(event) => void onFile(event)}
    />
  );
}
