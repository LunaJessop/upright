"use client";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.jpg,.jpeg,.png,.webp";

const addClass =
  "inline-flex min-h-11 cursor-pointer items-center border-brutal-xs border-black bg-nv-green-tint px-3 py-2 text-[10px] font-black uppercase tracking-wide text-black";
const removeClass =
  "inline-flex min-h-11 items-center border-brutal-xs border-black bg-red-600 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40";
const quietClass =
  "inline-flex min-h-11 items-center border-brutal-xs border-black bg-nv-paper px-3 py-2 text-[10px] font-black uppercase tracking-wide text-black disabled:cursor-not-allowed disabled:opacity-40";

const frameClass =
  "flex h-36 w-full items-center justify-center border-brutal-xs border-black bg-nv-canvas sm:h-40 sm:w-40";

export default function ItemPhotoView({
  itemName = "this item",
  previewUrl = "",
  hasPhoto = false,
  canWrite = false,
  busy = false,
  status = "",
  error = "",
  confirmingRemove = false,
  pendingRemove = false,
  readOnly = false,
  onCancelRemove,
  onConfirmRemove,
  onAskRemove,
  onKeep,
  onFile,
}) {
  const emptyText = status || (hasPhoto ? "Loading photo…" : "No photo yet.");
  const image = previewUrl ? (
    <img
      src={previewUrl}
      alt={`${itemName} photo`}
      className="h-36 w-full border-brutal-xs border-black bg-nv-canvas object-contain sm:h-40 sm:w-40"
    />
  ) : (
    <p className={`${frameClass} px-3 text-center text-xs font-medium text-nv-ink/70`} role={status ? "status" : undefined}>
      {emptyText}
    </p>
  );

  if (readOnly) {
    return (
      <div>
        {image}
        {status && previewUrl ? (
          <p className="mt-2 text-sm font-medium text-nv-ink/70" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm font-semibold text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
      aria-busy={busy ? "true" : "false"}
    >
      <div className="w-full shrink-0 sm:w-40">{image}</div>
      <div className="min-w-0 flex-1 space-y-2">
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
            <label className={`${addClass} ${busy ? "cursor-not-allowed opacity-40" : ""}`}>
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
            {pendingRemove ? (
              <button type="button" className={quietClass} disabled={busy} onClick={onKeep}>
                Keep photo
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
