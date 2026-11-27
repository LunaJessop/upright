export const ITEM_PHOTO_MAX_EDGE = 1600;
export const ITEM_PHOTO_MAX_BYTES = 500 * 1024;
export const ITEM_PHOTO_MAX_INCOMING_BYTES = 12 * 1024 * 1024;
export const ITEM_PHOTO_MAX_INCOMING_EDGE = 9000;
export const ITEM_PHOTO_MAX_INCOMING_PIXELS = 50_000_000;

export const PHOTO_MESSAGES = {
  empty: "Choose a photo to upload.",
  invalid: "Use a JPEG, PNG, WebP, or iPhone photo.",
  unreadable: "That photo could not be read. Try another one.",
  tooLargeIncoming: "This photo is too large. Use one under 12 MB.",
  tooLargeStored: "This photo is too large to store. Try a smaller one.",
  rate: "Too many photo uploads. Try again in a few minutes.",
  unavailable: "Item photos are not set up yet.",
  unconfigured: "Photo storage is not configured.",
  load: "The photo could not be loaded. Try again.",
  store: "The photo could not be stored. Try again.",
  remove: "The photo could not be removed. Try again.",
  save: "The photo could not be saved. Try again.",
};

const KIND_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

const QUALITIES = [0.75, 0.6, 0.45, 0.3];

export class ItemPhotoError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "ItemPhotoError";
    this.code = code;
  }
}

export function photoFileKind(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type === "image/jpg" || type === "image/jpeg") return "image/jpeg";
  if (type === "image/png" || type === "image/webp" || type === "image/heic" || type === "image/heif") {
    return type;
  }
  const name = String(file?.name || "");
  const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  return KIND_BY_EXT[ext] || null;
}

export function isHeicKind(kind) {
  return kind === "image/heic" || kind === "image/heif";
}

export function fitInside(width, height, maxEdge) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
    return { width: 1, height: 1 };
  }
  if (w <= maxEdge && h <= maxEdge) {
    return { width: Math.round(w), height: Math.round(h) };
  }
  const scale = maxEdge / Math.max(w, h);
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/** A replaced photo gets a new version. Anything else is not a version. */
export function photoVersion(photo) {
  if (photo == null || typeof photo !== "object") return "";
  const version = String(photo.version ?? "").trim().toLowerCase();
  return /^[a-f0-9]{64}$/.test(version) ? version : "";
}

export function photoMetadata(photo) {
  if (photo == null || typeof photo !== "object") return null;
  const width = Number(photo.width);
  const height = Number(photo.height);
  const bytes = Number(photo.bytes);
  const version = photoVersion(photo);
  return {
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
    bytes: Number.isFinite(bytes) ? bytes : null,
    format: photo.format == null ? null : String(photo.format),
    ...(version ? { version } : {}),
  };
}

/** The items list shows a photo only when the item has one. */
export function itemHasListPhoto(item) {
  return item?.photo != null;
}

/**
 * List rows ask for the small photo, not the full one.
 * The version is part of the address so a replaced photo is not the one
 * the browser was allowed to keep for a few minutes.
 * A missing or unexpected version still asks for the small photo.
 */
export function itemPhotoThumbPath(itemId, photo) {
  if (!canUploadItemPhoto(itemId) || photo == null) return "";
  const path = `/api/items/${Number(itemId)}/photo/thumb`;
  const version = photoVersion(photo);
  return version ? `${path}?v=${version}` : path;
}

/** A miss leaves the row as it was. The space stays only while a photo can still appear. */
export function itemThumbVisibility({ photo, previewUrl = "", failed = false } = {}) {
  if (photo == null || failed) return "hidden";
  return previewUrl ? "shown" : "pending";
}

/** Replace only the photo. Other item fields, including an open draft, stay put. */
export function applyItemPhoto(item, photo) {
  if (!item || typeof item !== "object") return item;
  return { ...item, photo: photo == null ? null : photoMetadata(photo) };
}

export function canUploadItemPhoto(itemId) {
  const id = Number(itemId);
  return Number.isInteger(id) && id > 0;
}

/** Identity of the photo currently on screen. Empty means there is nothing to show. */
export function photoViewKey({ itemId, photo, revision = 0, viewerId = "" } = {}) {
  if (!canUploadItemPhoto(itemId) || photo == null) return "";
  const meta = photoMetadata(photo);
  return [
    String(viewerId ?? ""),
    String(itemId),
    meta?.width ?? "",
    meta?.height ?? "",
    meta?.bytes ?? "",
    meta?.format ?? "",
    meta?.version ?? "",
    String(revision ?? 0),
  ].join(":");
}

/** A photo change waits with the form. Save applies it. Cancel throws it away. */
export function initialPhotoStage() {
  return { intent: "keep", file: null };
}

export function stageReplacement(file) {
  if (!file) throw new ItemPhotoError(PHOTO_MESSAGES.empty, "PHOTO_INVALID");
  return { intent: "replace", file };
}

/**
 * Stage a removal of the saved photo.
 * A photo that exists only in the form is discarded instead, so Remove does
 * not ask the server to delete something it never stored.
 */
export function stageRemoval({ hasSavedPhoto = false } = {}) {
  if (!hasSavedPhoto) return initialPhotoStage();
  return { intent: "remove", file: null };
}

export function photoStageView(stage, { hasSavedPhoto = false } = {}) {
  const intent = stage?.intent ?? "keep";
  if (intent === "replace" && stage?.file) {
    return { kind: "preview", file: stage.file, hasPhoto: true };
  }
  if (intent === "remove") {
    return { kind: "pending-remove", file: null, hasPhoto: false };
  }
  if (hasSavedPhoto) return { kind: "saved", file: null, hasPhoto: true };
  return { kind: "empty", file: null, hasPhoto: false };
}

export function withStagedPhoto(item, stage) {
  if (stage?.intent === "replace" && stage.file) {
    return { ...item, stagedPhoto: stage.file };
  }
  return item;
}

export function stageFromQueuedItem(item) {
  if (item?.stagedPhoto) return stageReplacement(item.stagedPhoto);
  return initialPhotoStage();
}

const QUEUED_ITEM_LOCAL_FIELDS = new Set(["id", "source_router_name", "stagedPhoto"]);

/** Fields the new-item queue keeps locally and must not send when creating. */
export function queuedItemRequest(item) {
  const payload = {};
  for (const [key, value] of Object.entries(item ?? {})) {
    if (QUEUED_ITEM_LOCAL_FIELDS.has(key)) continue;
    payload[key] = value;
  }
  return payload;
}

/**
 * One visible object URL at a time.
 * Starting a new item, viewer, or photo revokes the previous URL immediately.
 * A fetch that finishes after that change cannot put its URL back on screen.
 */
export function createPhotoPreview({ createUrl, revokeUrl }) {
  let generation = 0;
  let url = "";

  function clear() {
    if (!url) return;
    const previous = url;
    url = "";
    revokeUrl(previous);
  }

  return {
    get url() {
      return url;
    },
    start(key) {
      generation += 1;
      const ticket = generation;
      clear();
      return {
        get current() {
          return ticket === generation && Boolean(key);
        },
        accept(blob) {
          if (ticket !== generation || !key) return "";
          const next = createUrl(blob);
          if (url && url !== next) revokeUrl(url);
          url = next || "";
          return url;
        },
        cancel() {
          if (ticket !== generation) return;
          clear();
        },
      };
    },
    dispose() {
      generation += 1;
      clear();
    },
  };
}

export function photoContentType(blob) {
  const type = String(blob?.type || "").toLowerCase();
  if (type === "image/jpeg" || type === "image/jpg") return "image/jpeg";
  if (type === "image/webp") return "image/webp";
  return null;
}

export function messageForPhotoFailure(error, fallback = PHOTO_MESSAGES.save) {
  if (error instanceof ItemPhotoError && error.message) return error.message;
  const text = String(error?.message || "").trim();
  if (text && !/\(\d+\)$/.test(text)) return text;
  const code = error?.code;
  if (code === "PHOTO_TOO_LARGE") return PHOTO_MESSAGES.tooLargeStored;
  if (code === "PHOTO_INVALID") return PHOTO_MESSAGES.invalid;
  if (code === "PHOTO_RATE_LIMITED") return PHOTO_MESSAGES.rate;
  if (code === "PHOTO_STORAGE_UNAVAILABLE") return PHOTO_MESSAGES.unavailable;
  if (code === "PHOTO_STORAGE_UNCONFIGURED") return PHOTO_MESSAGES.unconfigured;
  if (code === "PHOTO_WRONG_ITEM") return PHOTO_MESSAGES.remove;
  return fallback;
}

export const PHOTO_SAVED_UPLOAD_FAILED =
  "Item saved, photo could not be uploaded. Add it from Edit.";

/** Shrink the chosen photo now. The form holds the result until Save. */
export async function prepareStagedPhoto(file, { compress = compressItemPhoto } = {}) {
  const prepared = await compress(file);
  return stageReplacement(prepared);
}

/**
 * Upload or delete only when the form is saved.
 * A kept photo does not call either function. Cancel is that path: discard the
 * stage, then commit what remains.
 */
export async function commitStagedPhoto(stage, { itemId, upload, remove } = {}) {
  const intent = stage?.intent ?? "keep";
  if (intent === "keep") return { applied: "none" };
  if (!canUploadItemPhoto(itemId)) {
    throw new ItemPhotoError(PHOTO_MESSAGES.save, "PHOTO_INVALID");
  }
  if (intent === "remove") {
    if (typeof remove !== "function") {
      throw new ItemPhotoError(PHOTO_MESSAGES.remove, "PHOTO_INVALID");
    }
    await remove(itemId);
    return { applied: "removed", photo: null };
  }
  if (intent === "replace") {
    if (!stage?.file) throw new ItemPhotoError(PHOTO_MESSAGES.empty, "PHOTO_INVALID");
    if (typeof upload !== "function") {
      throw new ItemPhotoError(PHOTO_MESSAGES.save, "PHOTO_INVALID");
    }
    const saved = await upload(itemId, stage.file);
    return { applied: "uploaded", photo: photoMetadata(saved?.photo) };
  }
  return { applied: "none" };
}

/**
 * The photo route needs an item id, so the item is created first.
 * A failed upload leaves the item in place and reports photoError.
 */
export async function createItemWithStagedPhoto({ item, stage, create, upload } = {}) {
  if (typeof create !== "function") {
    throw new ItemPhotoError(PHOTO_MESSAGES.save, "PHOTO_INVALID");
  }
  const created = await create(item);
  if ((stage?.intent ?? "keep") !== "replace" || !stage?.file) {
    return { item: created, photoError: null };
  }
  try {
    const result = await commitStagedPhoto(stage, { itemId: created?.id, upload });
    if (!created || typeof created !== "object") {
      return { item: created, photoError: null };
    }
    return { item: { ...created, photo: result.photo }, photoError: null };
  } catch (error) {
    return { item: created, photoError: error };
  }
}

export async function submitQueuedItems(items, { create, upload } = {}) {
  const failed = [];
  const photoFailures = [];
  let createdCount = 0;
  let firstError = "";
  for (const queued of items ?? []) {
    try {
      const result = await createItemWithStagedPhoto({
        item: queuedItemRequest(queued),
        stage: stageFromQueuedItem(queued),
        create,
        upload,
      });
      createdCount += 1;
      if (result.photoError) {
        photoFailures.push({
          id: result.item?.id ?? null,
          item: result.item,
        });
      }
    } catch (error) {
      if (!firstError) firstError = String(error?.message || "Unknown error");
      failed.push(queued);
    }
  }
  return { failed, createdCount, firstError, photoFailures };
}

export function photoFailureDestination(photoFailures) {
  const match = (photoFailures ?? []).find((row) => canUploadItemPhoto(row?.id));
  if (!match) return null;
  return {
    href: `/items/${match.id}`,
    message: PHOTO_SAVED_UPLOAD_FAILED,
  };
}

function assertDecodableSize(width, height) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new ItemPhotoError(PHOTO_MESSAGES.unreadable, "PHOTO_INVALID");
  }
  if (
    width > ITEM_PHOTO_MAX_INCOMING_EDGE ||
    height > ITEM_PHOTO_MAX_INCOMING_EDGE ||
    width * height > ITEM_PHOTO_MAX_INCOMING_PIXELS
  ) {
    throw new ItemPhotoError(PHOTO_MESSAGES.tooLargeStored, "PHOTO_TOO_LARGE");
  }
}

async function decodeInBrowser(file) {
  if (typeof createImageBitmap !== "function") {
    throw new Error("decode unavailable");
  }
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

async function convertHeicInBrowser(file) {
  let heicTo;
  try {
    // The standard entry decodes in a worker and draws on the page.
    // heic-to/next is the build meant to be called from inside a worker.
    ({ heicTo } = await import("heic-to"));
  } catch {
    throw new ItemPhotoError(PHOTO_MESSAGES.unreadable, "PHOTO_INVALID");
  }
  try {
    const bitmap = await heicTo({
      blob: file,
      type: "bitmap",
      options: { imageOrientation: "from-image" },
    });
    if (Array.isArray(bitmap)) return bitmap[0];
    return bitmap;
  } catch (error) {
    if (error instanceof ItemPhotoError) throw error;
    throw new ItemPhotoError(PHOTO_MESSAGES.unreadable, "PHOTO_INVALID");
  }
}

function browserSupportsWebp() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function canvasBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function encodeInBrowser(image, { type, quality, width, height }) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ItemPhotoError(PHOTO_MESSAGES.unreadable, "PHOTO_INVALID");
  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasBlob(canvas, type, quality);
  if (blob || type !== "image/webp") return blob;
  return canvasBlob(canvas, "image/jpeg", quality);
}

/**
 * Shrink a phone photo before upload.
 * The request body stays at or under 500 KB so it is well under the host limit.
 * JPEG and WebP are encoded here. iPhone photos that the browser cannot decode
 * are converted with a library loaded only for that case.
 */
export async function compressItemPhoto(file, options = {}) {
  if (!file) throw new ItemPhotoError(PHOTO_MESSAGES.empty, "PHOTO_INVALID");
  const kind = photoFileKind(file);
  if (!kind) throw new ItemPhotoError(PHOTO_MESSAGES.invalid, "PHOTO_INVALID");
  const size = Number(file.size);
  if (!Number.isFinite(size) || size < 1) {
    throw new ItemPhotoError(PHOTO_MESSAGES.empty, "PHOTO_INVALID");
  }
  if (size > ITEM_PHOTO_MAX_INCOMING_BYTES) {
    throw new ItemPhotoError(PHOTO_MESSAGES.tooLargeIncoming, "PHOTO_TOO_LARGE");
  }

  const decode = options.decode || decodeInBrowser;
  const encode = options.encode || encodeInBrowser;
  const convertHeic = options.convertHeic || convertHeicInBrowser;
  const supportsWebp = options.supportsWebp ?? browserSupportsWebp();

  let image;
  try {
    image = await decode(file);
  } catch (error) {
    if (error instanceof ItemPhotoError) throw error;
    if (!isHeicKind(kind)) {
      throw new ItemPhotoError(PHOTO_MESSAGES.unreadable, "PHOTO_INVALID");
    }
    image = await convertHeic(file);
  }

  const width = Number(image?.width);
  const height = Number(image?.height);
  try {
    assertDecodableSize(width, height);
  } catch (error) {
    image?.close?.();
    throw error;
  }

  const outputType = supportsWebp ? "image/webp" : "image/jpeg";
  let edge = ITEM_PHOTO_MAX_EDGE;
  try {
    for (let shrink = 0; shrink < 5; shrink += 1) {
      const fitted = fitInside(width, height, edge);
      for (const quality of QUALITIES) {
        const blob = await encode(image, {
          type: outputType,
          quality,
          width: fitted.width,
          height: fitted.height,
        });
        const contentType = photoContentType(blob);
        if (!blob || !contentType || blob.size < 1) continue;
        if (blob.size <= ITEM_PHOTO_MAX_BYTES) return blob;
      }
      const nextEdge = Math.max(320, Math.round(edge * 0.75));
      if (nextEdge === edge) break;
      edge = nextEdge;
    }
  } catch (error) {
    if (error instanceof ItemPhotoError) throw error;
    throw new ItemPhotoError(PHOTO_MESSAGES.unreadable, "PHOTO_INVALID");
  } finally {
    image?.close?.();
  }

  throw new ItemPhotoError(PHOTO_MESSAGES.tooLargeStored, "PHOTO_TOO_LARGE");
}
