"use client";

const frameClass =
  "h-10 w-10 shrink-0 border-brutal-xs border-black bg-nv-canvas object-cover";

/** A 40px square. The item name is already in the row, so the image is not named again. */
export default function ItemPhotoThumbView({ previewUrl = "", onError }) {
  if (!previewUrl) return null;
  return (
    // Loaded with the session, then shown from a local object URL.
    // next/image cannot attach that session.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={previewUrl}
      alt=""
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      className={frameClass}
      onError={onError}
    />
  );
}
