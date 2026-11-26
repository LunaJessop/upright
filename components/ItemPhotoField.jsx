"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ItemPhotoView from "@/components/ItemPhotoView";
import { useSavedItemPhoto } from "@/components/ItemPhoto";
import { useToast } from "@/components/Toast";
import {
  initialPhotoStage,
  messageForPhotoFailure,
  photoStageView,
  prepareStagedPhoto,
  stageRemoval,
} from "@/lib/itemPhoto";

function useObjectUrl(file) {
  const [url, setUrl] = useState("");
  useLayoutEffect(() => {
    if (!file) {
      queueMicrotask(() => setUrl(""));
      return undefined;
    }
    const next = URL.createObjectURL(file);
    let active = true;
    queueMicrotask(() => {
      if (!active) {
        URL.revokeObjectURL(next);
        return;
      }
      setUrl(next);
    });
    return () => {
      active = false;
      URL.revokeObjectURL(next);
    };
  }, [file]);
  return url;
}

export default function ItemPhotoField({
  itemId,
  itemName = "this item",
  savedPhoto = null,
  stage,
  onStage,
  discardEpoch = 0,
  canWrite = true,
  busy = false,
  className = "",
  onBusyChange,
}) {
  const { impersonating } = useAuth();
  const toast = useToast();
  const view = photoStageView(stage, { hasSavedPhoto: savedPhoto != null });
  const saved = useSavedItemPhoto({
    itemId,
    photo: savedPhoto,
    enabled: view.kind === "saved",
  });
  const stagedUrl = useObjectUrl(view.kind === "preview" ? view.file : null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [seenEpoch, setSeenEpoch] = useState(discardEpoch);
  const epochRef = useRef(discardEpoch);
  const opRef = useRef(0);
  const liveRef = useRef(true);

  if (seenEpoch !== discardEpoch) {
    setSeenEpoch(discardEpoch);
    setConfirmingRemove(false);
    setError("");
    setPreparing(false);
  }

  useLayoutEffect(() => {
    liveRef.current = true;
    return () => {
      liveRef.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    epochRef.current = discardEpoch;
    opRef.current += 1;
  }, [discardEpoch]);

  useLayoutEffect(() => {
    onBusyChange?.(preparing);
    return () => onBusyChange?.(false);
  }, [preparing, onBusyChange]);

  const allowWrite = Boolean(canWrite) && !impersonating;
  const controlsBusy = busy || preparing;
  const previewUrl = view.kind === "preview" ? stagedUrl : view.kind === "saved" ? saved.previewUrl : "";
  const status = preparing
    ? "Preparing photo…"
    : view.kind === "pending-remove"
      ? "This photo will be removed when you save."
      : view.kind === "preview"
        ? "This photo uploads when you save."
        : view.kind === "saved"
          ? saved.status
          : "";
  const shownError = error || (view.kind === "saved" ? saved.error : "");

  async function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || controlsBusy || !allowWrite) return;
    const op = opRef.current + 1;
    opRef.current = op;
    const epoch = epochRef.current;
    setPreparing(true);
    setError("");
    setConfirmingRemove(false);
    try {
      const next = await prepareStagedPhoto(file);
      if (!liveRef.current || opRef.current !== op || epochRef.current !== epoch) return;
      onStage?.(next);
    } catch (err) {
      if (!liveRef.current || opRef.current !== op || epochRef.current !== epoch) return;
      const message = messageForPhotoFailure(err);
      setError(message);
      toast.error(message);
    } finally {
      if (opRef.current === op) setPreparing(false);
    }
  }

  function confirmRemove() {
    if (controlsBusy || !allowWrite) return;
    setError("");
    setConfirmingRemove(false);
    onStage?.(stageRemoval({ hasSavedPhoto: savedPhoto != null }));
  }

  return (
    <div className={className}>
      <p className="text-[10px] font-black uppercase tracking-wide text-nv-ink/55">Photo</p>
      <div className="mt-2">
        <ItemPhotoView
          itemName={itemName || "this item"}
          previewUrl={previewUrl}
          hasPhoto={view.hasPhoto}
          canWrite={allowWrite}
          busy={controlsBusy}
          status={status}
          error={shownError}
          confirmingRemove={confirmingRemove}
          pendingRemove={view.kind === "pending-remove"}
          onCancelRemove={() => setConfirmingRemove(false)}
          onConfirmRemove={confirmRemove}
          onAskRemove={() => {
            if (controlsBusy || !allowWrite) return;
            setConfirmingRemove(true);
          }}
          onKeep={() => {
            if (controlsBusy || !allowWrite) return;
            setError("");
            setConfirmingRemove(false);
            onStage?.(initialPhotoStage());
          }}
          onFile={(event) => void onFile(event)}
        />
      </div>
    </div>
  );
}
