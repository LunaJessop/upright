"use client";

import { useEffect, useRef, useState } from "react";
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
  messageForPhotoFailure,
  PHOTO_MESSAGES,
  photoMetadata,
} from "@/lib/itemPhoto";

export default function ItemPhoto({ itemId, itemName, photo, canWrite, onPhotoChange }) {
  const { impersonating } = useAuth();
  const toast = useToast();
  const urlRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [revision, setRevision] = useState(0);
  const hasPhoto = photo != null;
  const allowWrite = Boolean(canWrite);
  const photoKey = hasPhoto
    ? `${photo.width ?? ""}:${photo.height ?? ""}:${photo.bytes ?? ""}:${photo.format ?? ""}`
    : "";

  function replaceUrl(next) {
    if (urlRef.current && urlRef.current !== next) URL.revokeObjectURL(urlRef.current);
    urlRef.current = next || null;
    setPreviewUrl(next || "");
  }

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!canUploadItemPhoto(itemId) || !hasPhoto) {
      replaceUrl("");
      setStatus("");
      return undefined;
    }
    let cancelled = false;
    setStatus((current) => current || "Loading photo…");
    setError("");
    GetItemPhoto(itemId)
      .then((blob) => {
        if (cancelled) return;
        replaceUrl(URL.createObjectURL(blob));
        setStatus("");
      })
      .catch((err) => {
        if (cancelled) return;
        replaceUrl("");
        setStatus("");
        setError(messageForPhotoFailure(err, PHOTO_MESSAGES.load));
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, hasPhoto, photoKey, revision]);

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy || impersonating || !allowWrite || !canUploadItemPhoto(itemId)) return;
    setBusy(true);
    setError("");
    setConfirmingRemove(false);
    setStatus("Preparing photo…");
    try {
      const prepared = await compressItemPhoto(file);
      setStatus("Saving photo…");
      const saved = await UploadItemPhoto(itemId, prepared);
      onPhotoChange?.(photoMetadata(saved?.photo));
      setRevision((value) => value + 1);
      setStatus("");
      toast.success("Photo saved.");
    } catch (err) {
      const message = messageForPhotoFailure(err);
      setStatus("");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    if (busy || impersonating || !allowWrite || !canUploadItemPhoto(itemId)) return;
    setBusy(true);
    setError("");
    setStatus("Removing photo…");
    try {
      await DeleteItemPhoto(itemId);
      onPhotoChange?.(null);
      replaceUrl("");
      setRevision((value) => value + 1);
      setConfirmingRemove(false);
      setStatus("");
      toast.success("Photo removed.");
    } catch (err) {
      const message = messageForPhotoFailure(err, PHOTO_MESSAGES.remove);
      setStatus("");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
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
