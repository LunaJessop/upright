import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ITEM_PHOTO_MAX_BYTES,
  ITEM_PHOTO_MAX_EDGE,
  ITEM_PHOTO_MAX_INCOMING_BYTES,
  applyItemPhoto,
  canUploadItemPhoto,
  compressItemPhoto,
  createPhotoPreview,
  fitInside,
  photoViewKey,
  messageForPhotoFailure,
  photoContentType,
  photoFileKind,
  PHOTO_MESSAGES,
} from "./itemPhoto.js";

function fileLike({ name, type, size }) {
  return { name, type, size };
}

describe("item photo files", () => {
  it("accepts jpeg, png, webp, and iPhone photos, including by extension", () => {
    assert.equal(photoFileKind(fileLike({ name: "a.jpg", type: "image/jpeg", size: 10 })), "image/jpeg");
    assert.equal(photoFileKind(fileLike({ name: "a.PNG", type: "", size: 10 })), "image/png");
    assert.equal(photoFileKind(fileLike({ name: "IMG.HEIC", type: "", size: 10 })), "image/heic");
    assert.equal(photoFileKind(fileLike({ name: "notes.pdf", type: "application/pdf", size: 10 })), null);
    assert.equal(photoFileKind(fileLike({ name: "anim.gif", type: "image/gif", size: 10 })), null);
  });

  it("fits inside 1600 pixels without enlarging", () => {
    assert.deepEqual(fitInside(3200, 1800, ITEM_PHOTO_MAX_EDGE), { width: 1600, height: 900 });
    assert.deepEqual(fitInside(800, 600, ITEM_PHOTO_MAX_EDGE), { width: 800, height: 600 });
  });

  it("refuses a huge or unreadable file before decoding it", async () => {
    let decoded = 0;
    await assert.rejects(
      compressItemPhoto(fileLike({ name: "big.jpg", type: "image/jpeg", size: ITEM_PHOTO_MAX_INCOMING_BYTES + 1 }), {
        decode: async () => {
          decoded += 1;
          return { width: 10, height: 10 };
        },
      }),
      (error) => error.message === PHOTO_MESSAGES.tooLargeIncoming
    );
    await assert.rejects(
      compressItemPhoto(fileLike({ name: "notes.pdf", type: "application/pdf", size: 20 }), {
        decode: async () => {
          decoded += 1;
          return { width: 10, height: 10 };
        },
      }),
      (error) => error.message === PHOTO_MESSAGES.invalid
    );
    assert.equal(decoded, 0);
  });

  it("shrinks a wide photo to webp at or under 500 KB", async () => {
    const calls = [];
    const blob = await compressItemPhoto(fileLike({ name: "phone.jpg", type: "image/jpeg", size: 4_000_000 }), {
      supportsWebp: true,
      decode: async () => ({ width: 3200, height: 1800, close() {} }),
      encode: async (_image, spec) => {
        calls.push(spec);
        const bytes = spec.quality <= 0.6 ? 400_000 : 800_000;
        return new Blob([new Uint8Array(bytes)], { type: spec.type });
      },
    });
    assert.equal(blob.size <= ITEM_PHOTO_MAX_BYTES, true);
    assert.equal(photoContentType(blob), "image/webp");
    assert.equal(calls[0].width <= ITEM_PHOTO_MAX_EDGE, true);
    assert.equal(calls[0].height <= ITEM_PHOTO_MAX_EDGE, true);
    assert.deepEqual(
      { width: calls[0].width, height: calls[0].height },
      { width: 1600, height: 900 }
    );
  });

  it("uses jpeg when webp is unavailable", async () => {
    const blob = await compressItemPhoto(fileLike({ name: "phone.jpg", type: "image/jpeg", size: 1000 }), {
      supportsWebp: false,
      decode: async () => ({ width: 400, height: 300, close() {} }),
      encode: async (_image, spec) => new Blob([new Uint8Array(100)], { type: spec.type }),
    });
    assert.equal(photoContentType(blob), "image/jpeg");
  });

  it("loads the iPhone converter only when the browser cannot decode the photo", async () => {
    let converted = 0;
    const heic = fileLike({ name: "IMG.HEIC", type: "", size: 2_000_000 });
    await compressItemPhoto(heic, {
      supportsWebp: true,
      decode: async () => {
        throw new Error("unsupported");
      },
      convertHeic: async () => {
        converted += 1;
        return { width: 1200, height: 800, close() {} };
      },
      encode: async (_image, spec) => new Blob([new Uint8Array(80)], { type: spec.type }),
    });
    assert.equal(converted, 1);

    converted = 0;
    await compressItemPhoto(heic, {
      supportsWebp: true,
      decode: async () => ({ width: 100, height: 80, close() {} }),
      convertHeic: async () => {
        converted += 1;
        return { width: 10, height: 10 };
      },
      encode: async (_image, spec) => new Blob([new Uint8Array(80)], { type: spec.type }),
    });
    assert.equal(converted, 0);

    await assert.rejects(
      compressItemPhoto(fileLike({ name: "bad.jpg", type: "image/jpeg", size: 100 }), {
        decode: async () => {
          throw new Error("broken");
        },
        convertHeic: async () => {
          converted += 1;
          return { width: 10, height: 10 };
        },
      }),
      (error) => error.message === PHOTO_MESSAGES.unreadable
    );
    assert.equal(converted, 0);
  });

  it("stops before drawing a photo that is too large to handle", async () => {
    let encoded = 0;
    await assert.rejects(
      compressItemPhoto(fileLike({ name: "huge.png", type: "image/png", size: 1000 }), {
        decode: async () => ({ width: 9001, height: 100, close() {} }),
        encode: async () => {
          encoded += 1;
          return new Blob([new Uint8Array(10)], { type: "image/webp" });
        },
      }),
      (error) => error.message === PHOTO_MESSAGES.tooLargeStored
    );
    assert.equal(encoded, 0);
  });

  it("keeps an open item's other fields and drops any public address", () => {
    const item = {
      id: 4,
      name: "Soap",
      description: "Still the draft",
      unit_of_measure: "each",
      photo: null,
    };
    const next = applyItemPhoto(item, {
      width: 800,
      height: 600,
      bytes: 1200,
      format: "webp",
      url: "https://res.cloudinary.com/demo/secret",
      image_public_id: "c/4/items/4/secret",
    });
    assert.equal(next.name, "Soap");
    assert.equal(next.description, "Still the draft");
    assert.equal(next.unit_of_measure, "each");
    assert.deepEqual(next.photo, { width: 800, height: 600, bytes: 1200, format: "webp" });
    assert.equal(JSON.stringify(next).includes("cloudinary"), false);
    assert.equal(canUploadItemPhoto(4), true);
    assert.equal(canUploadItemPhoto(null), false);
    assert.equal(canUploadItemPhoto("new"), false);
  });

  it("drops a delayed photo when the item changes and revokes the old address", () => {
    const revoked = [];
    const created = [];
    const session = createPhotoPreview({
      createUrl(blob) {
        const url = `blob:${blob}`;
        created.push(url);
        return url;
      },
      revokeUrl(url) {
        revoked.push(url);
      },
    });
    const itemA = session.start(photoViewKey({
      itemId: 4,
      photo: { width: 10, height: 10, bytes: 4, format: "webp" },
      viewerId: "shop-a",
    }));
    assert.equal(itemA.accept("photo-a"), "blob:photo-a");
    assert.equal(session.url, "blob:photo-a");

    const itemB = session.start(photoViewKey({
      itemId: 9,
      photo: { width: 10, height: 10, bytes: 4, format: "webp" },
      viewerId: "shop-a",
    }));
    assert.equal(session.url, "");
    assert.deepEqual(revoked, ["blob:photo-a"]);
    assert.equal(itemA.accept("photo-a-late"), "");
    assert.equal(created.includes("blob:photo-a-late"), false);
    assert.equal(session.url, "");

    assert.equal(itemB.accept("photo-b"), "blob:photo-b");
    assert.equal(session.url, "blob:photo-b");
    itemB.cancel();
    assert.equal(session.url, "");
    assert.deepEqual(revoked, ["blob:photo-a", "blob:photo-b"]);

    const otherShop = session.start(photoViewKey({
      itemId: 9,
      photo: { width: 10, height: 10, bytes: 4, format: "webp" },
      viewerId: "shop-b",
    }));
    assert.notEqual(
      photoViewKey({ itemId: 9, photo: { width: 10, height: 10, bytes: 4, format: "webp" }, viewerId: "shop-a" }),
      photoViewKey({ itemId: 9, photo: { width: 10, height: 10, bytes: 4, format: "webp" }, viewerId: "shop-b" })
    );
    otherShop.accept("photo-shop-b");
    session.dispose();
    assert.equal(session.url, "");
    assert.equal(revoked.at(-1), "blob:photo-shop-b");
    assert.equal(session.start("").accept("after-dispose"), "");
  });

  it("prefers the server's friendly wording", () => {
    assert.equal(
      messageForPhotoFailure({
        message: "This photo is too large. Use one under 12 MB.",
        code: "PHOTO_TOO_LARGE",
      }),
      "This photo is too large. Use one under 12 MB."
    );
    assert.equal(
      messageForPhotoFailure({ message: "Failed to save photo (500)", code: null }),
      PHOTO_MESSAGES.save
    );
    assert.equal(
      messageForPhotoFailure({ message: "", code: "PHOTO_RATE_LIMITED" }),
      PHOTO_MESSAGES.rate
    );
    assert.equal(
      messageForPhotoFailure({ message: "", code: "PHOTO_STORAGE_UNAVAILABLE" }),
      PHOTO_MESSAGES.unavailable
    );
  });
});
