"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GetItemPhotoThumb } from "@/app/api/apiHandler";
import { useAuth } from "@/components/AuthProvider";
import ItemPhotoThumbView from "@/components/ItemPhotoThumbView";
import {
  createPhotoPreview,
  itemThumbVisibility,
  photoVersion,
  photoViewKey,
} from "@/lib/itemPhoto";

function useNearViewport(active) {
  const ref = useRef(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver !== "function");

  useEffect(() => {
    if (!active || near) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver !== "function") return undefined;
    let stopped = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (stopped || !entries.some((entry) => entry.isIntersecting)) return;
        stopped = true;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin: "240px 0px" }
    );
    observer.observe(node);
    return () => {
      stopped = true;
      observer.disconnect();
    };
  }, [active, near]);

  return [ref, near];
}

function useItemPhotoThumb({ itemId, photo, enabled }) {
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
  const version = photoVersion(activePhoto);
  const [previewUrl, setPreviewUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [seenViewKey, setSeenViewKey] = useState(viewKey);
  if (seenViewKey !== viewKey) {
    setSeenViewKey(viewKey);
    setPreviewUrl("");
    setFailed(false);
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
    GetItemPhotoThumb(itemId, { version, signal: controller.signal })
      .then((blob) => {
        const next = request.accept(blob);
        if (!next) return;
        setPreviewUrl(next);
        setFailed(false);
      })
      .catch((err) => {
        if (!request.current || controller.signal.aborted || err?.name === "AbortError") return;
        setPreviewUrl("");
        setFailed(true);
      });
    return () => {
      controller.abort();
      request.cancel();
    };
  }, [itemId, version, viewKey]);

  return { previewUrl, failed };
}

export default function ItemPhotoThumb({ itemId, photo = null }) {
  const [ref, near] = useNearViewport(photo != null);
  const loaded = useItemPhotoThumb({ itemId, photo, enabled: near });
  const [brokenUrl, setBrokenUrl] = useState("");
  const broken = Boolean(loaded.previewUrl) && brokenUrl === loaded.previewUrl;
  const visibility = itemThumbVisibility({
    photo,
    previewUrl: loaded.previewUrl,
    failed: loaded.failed || broken,
  });
  if (visibility === "hidden") return null;
  return (
    <span ref={ref} className="inline-flex h-10 w-10 shrink-0">
      {visibility === "shown" ? (
        <ItemPhotoThumbView
          previewUrl={loaded.previewUrl}
          onError={() => setBrokenUrl(loaded.previewUrl)}
        />
      ) : null}
    </span>
  );
}
