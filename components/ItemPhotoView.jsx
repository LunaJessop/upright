"use client";

import { brutalChrome } from "@/lib/chrome";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp";

const addClass =
  "inline-flex min-h-11 cursor-pointer items-center border-brutal-xs border-black bg-nv-green-tint px-3 py-2 text-[10px] font-black uppercase tracking-wide text-black";
const removeClass =
  "inline-flex min-h-11 items-center border-brutal-xs border-black bg-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40";
const quietClass =
  "inline-flex min-h-11 items-center border-brutal-xs border-black bg-nv-paper px-3 py-2 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40";

export default function ItemPhotoView({
  itemName = "this item",
  previewUrl = "",
  hasPhoto = false,
  canWrite = false,
  busy = false,
  status = "",
  error = "",
  confirmingRemove = false,
  savedOnly = false,
  onCancelRemove,
  onConfirmRemove,
  onAskRemove,
  onFile,
}) {
  if (savedOnly) {
    return (
      <section className={`${brutalChrome} bg-nv-paper`}>
        <header className="border-b-brutal-xs border-black bg-nv-green-dark px-4 py-2">
          <h2 className="text-sm font-black uppercase tracking-wide">Photo</h2>
        </header>
        <p className="p-4 text-sm font-medium text-nv-ink/70">
          You can add a photo after this item is saved.
        </p>
      </section>
    );
  }

  return (
    <section className={`${brutalChrome} bg-nv-paper`} aria-busy={busy ? "true" : "false"}>
      <header className="border-b-brutal-xs border-black bg-nv-green-dark px-4 py-2">
        <h2 className="text-sm font-black uppercase tracking-wide">Photo</h2>
      </header>
      <div className="space-y-3 p-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${itemName} photo`}
            className="max-h-56 w-full bg-nv-canvas object-contain sm:max-h-80"
          />
        ) : (
          <p className="text-sm font-medium text-nv-ink/70" role={status ? "status" : undefined}>
            {status || (hasPhoto ? "Loading photo…" : "No photo yet.")}
          </p>
        )}
        {status && previewUrl ? (
          <p className="text-sm font-medium text-nv-ink/70" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {canWrite && confirmingRemove ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-nv-ink">
              Remove the photo from {itemName}? The item itself stays.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={quietClass} disabled={busy} onClick={onCancelRemove}>
                Go back
              </button>
              <button type="button" className={removeClass} disabled={busy} onClick={onConfirmRemove}>
                Remove photo
              </button>
            </div>
          </div>
        ) : null}
        {canWrite && !confirmingRemove ? (
          <div className="flex flex-wrap gap-2">
            <label className={addClass}>
              {hasPhoto ? "Replace photo" : "Add photo"}
              <input
                type="file"
                accept={ACCEPT}
                className="sr-only"
                aria-label={hasPhoto ? "Replace photo" : "Add photo"}
                disabled={busy}
                onChange={onFile}
              />
            </label>
            {hasPhoto ? (
              <button type="button" className={removeClass} disabled={busy} onClick={onAskRemove}>
                Remove photo
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
