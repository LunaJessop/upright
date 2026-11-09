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

export function photoMetadata(photo) {
  if (photo == null || typeof photo !== "object") return null;
  const width = Number(photo.width);
  const height = Number(photo.height);
  const bytes = Number(photo.bytes);
  return {
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
    bytes: Number.isFinite(bytes) ? bytes : null,
    format: photo.format == null ? null : String(photo.format),
  };
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
    ({ heicTo } = await import("heic-to/next"));
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
