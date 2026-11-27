import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ITEM_PHOTO_MAX_BYTES,
  ITEM_PHOTO_MAX_EDGE,
  ITEM_PHOTO_MAX_INCOMING_BYTES,
  applyItemPhoto,
  canUploadItemPhoto,
  commitStagedPhoto,
  itemHasListPhoto,
  itemPhotoThumbPath,
  itemThumbVisibility,
  compressItemPhoto,
  createItemWithStagedPhoto,
  createPhotoPreview,
  fitInside,
  initialPhotoStage,
  messageForPhotoFailure,
  photoContentType,
  photoFailureDestination,
  photoVersion,
  photoFileKind,
  PHOTO_MESSAGES,
  PHOTO_SAVED_UPLOAD_FAILED,
  photoStageView,
  photoViewKey,
  prepareStagedPhoto,
  stageFromQueuedItem,
  stageRemoval,
  submitQueuedItems,
  withStagedPhoto,
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
    const version = "ab".repeat(32);
    const kept = applyItemPhoto(item, {
      width: 800,
      height: 600,
      bytes: 1200,
      format: "webp",
      version: version.toUpperCase(),
      url: "https://res.cloudinary.com/demo/secret",
    });
    assert.equal(kept.photo.version, version);
    assert.equal(JSON.stringify(kept).includes("cloudinary"), false);
    const dropped = applyItemPhoto(item, {
      width: 10,
      height: 10,
      bytes: 4,
      format: "webp",
      version: "https://res.cloudinary.com/demo/secret",
    });
    assert.equal(dropped.photo.version, undefined);
    assert.equal(photoVersion(dropped.photo), "");
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
    const versionA = "a".repeat(64);
    const versionB = "b".repeat(64);
    const samePixels = { width: 10, height: 10, bytes: 4, format: "webp" };
    assert.notEqual(
      photoViewKey({ itemId: 9, photo: { ...samePixels, version: versionA }, viewerId: "shop-a" }),
      photoViewKey({ itemId: 9, photo: { ...samePixels, version: versionB }, viewerId: "shop-a" })
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

  it("stages a compressed photo and uploads it only when the form is saved", async () => {
    const original = { name: "phone.jpg", type: "image/jpeg", size: 100 };
    const prepared = { type: "image/webp", size: 40 };
    let compressed = 0;
    const stage = await prepareStagedPhoto(original, {
      compress: async (file) => {
        compressed += 1;
        assert.equal(file, original);
        return prepared;
      },
    });
    assert.equal(compressed, 1);
    assert.equal(stage.intent, "replace");
    assert.equal(stage.file, prepared);
    assert.equal(photoStageView(stage).kind, "preview");

    const calls = [];
    const held = await commitStagedPhoto(initialPhotoStage(), {
      itemId: 4,
      upload: async () => {
        calls.push("upload");
      },
      remove: async () => {
        calls.push("remove");
      },
    });
    assert.deepEqual(held, { applied: "none" });
    assert.deepEqual(calls, []);

    const saved = await commitStagedPhoto(stage, {
      itemId: 4,
      upload: async (id, file) => {
        calls.push(["upload", id, file]);
        return { photo: { width: 10, height: 8, bytes: 40, format: "webp" } };
      },
      remove: async () => {
        calls.push("remove");
      },
    });
    assert.equal(saved.applied, "uploaded");
    assert.deepEqual(saved.photo, { width: 10, height: 8, bytes: 40, format: "webp" });
    assert.deepEqual(calls, [["upload", 4, prepared]]);
  });

  it("drops a photo that was only chosen in the form, and stages removal of a saved one", async () => {
    const file = { type: "image/webp", size: 20 };
    const cleared = stageRemoval({
      hasSavedPhoto: false,
      stage: { intent: "replace", file },
    });
    assert.deepEqual(cleared, initialPhotoStage());
    assert.equal(photoStageView(cleared).kind, "empty");

    const removal = stageRemoval({ hasSavedPhoto: true, stage: { intent: "replace", file } });
    assert.deepEqual(removal, { intent: "remove", file: null });
    assert.equal(photoStageView(removal, { hasSavedPhoto: true }).kind, "pending-remove");

    let uploaded = 0;
    const result = await commitStagedPhoto(removal, {
      itemId: 4,
      upload: async () => {
        uploaded += 1;
      },
      remove: async (id) => {
        assert.equal(id, 4);
      },
    });
    assert.equal(uploaded, 0);
    assert.deepEqual(result, { applied: "removed", photo: null });

    await assert.rejects(
      commitStagedPhoto(removal, {
        itemId: null,
        upload: async () => {},
        remove: async () => {},
      }),
      (error) => error.message === PHOTO_MESSAGES.save
    );
  });

  it("creates the item before the photo and keeps the item when the photo fails", async () => {
    const file = { type: "image/webp", size: 12 };
    const created = { id: 9, name: "Soap" };
    let uploads = 0;
    const failed = await createItemWithStagedPhoto({
      item: { name: "Soap" },
      stage: { intent: "replace", file },
      create: async (item) => {
        assert.equal(item.stagedPhoto, undefined);
        assert.equal(item.name, "Soap");
        return created;
      },
      upload: async (id, body) => {
        uploads += 1;
        assert.equal(id, 9);
        assert.equal(body, file);
        throw new Error("The photo could not be stored. Try again.");
      },
    });
    assert.equal(uploads, 1);
    assert.equal(failed.item, created);
    assert.equal(failed.photoError.message, "The photo could not be stored. Try again.");

    uploads = 0;
    const plain = await createItemWithStagedPhoto({
      item: { name: "Soap" },
      stage: initialPhotoStage(),
      create: async () => ({ id: 3, name: "Soap" }),
      upload: async () => {
        uploads += 1;
      },
    });
    assert.equal(uploads, 0);
    assert.equal(plain.photoError, null);
    assert.equal(plain.item.id, 3);

    await assert.rejects(
      createItemWithStagedPhoto({
        item: { name: "Soap" },
        stage: { intent: "replace", file },
        create: async () => {
          throw new Error("Create failed");
        },
        upload: async () => {
          uploads += 1;
        },
      }),
      /Create failed/
    );
    assert.equal(uploads, 0);
  });

  it("creates each queued item before its photo and points at the saved item when the photo fails", async () => {
    const file = { type: "image/webp", size: 20 };
    const calls = [];
    const outcome = await submitQueuedItems(
      [
        { id: 1, name: "Soap", source_router_name: "Bars", stagedPhoto: file, sku: null },
        { id: 2, name: "Box" },
        { id: 3, name: "Oil" },
      ],
      {
        create: async (item) => {
          calls.push([
            "create",
            item.name,
            Object.hasOwn(item, "stagedPhoto"),
            Object.hasOwn(item, "id"),
            Object.hasOwn(item, "source_router_name"),
          ]);
          if (item.name === "Oil") throw new Error("nope");
          return { id: item.name === "Soap" ? 40 : 41, name: item.name };
        },
        upload: async (id, body) => {
          calls.push(["upload", id, body]);
          throw new Error("storage down");
        },
      }
    );
    assert.equal(outcome.createdCount, 2);
    assert.equal(outcome.failed.length, 1);
    assert.equal(outcome.failed[0].name, "Oil");
    assert.equal(outcome.firstError, "nope");
    assert.equal(outcome.photoFailures.length, 1);
    assert.equal(outcome.photoFailures[0].id, 40);
    assert.equal(outcome.photoFailures[0].item.name, "Soap");
    assert.deepEqual(photoFailureDestination(outcome.photoFailures), {
      href: "/items/40",
      message: PHOTO_SAVED_UPLOAD_FAILED,
    });
    assert.equal(PHOTO_SAVED_UPLOAD_FAILED, "Item saved, photo could not be uploaded. Add it from Edit.");
    assert.deepEqual(calls, [
      ["create", "Soap", false, false, false],
      ["upload", 40, file],
      ["create", "Box", false, false, false],
      ["create", "Oil", false, false, false],
    ]);
    assert.equal(stageFromQueuedItem({ stagedPhoto: file }).file, file);
    assert.equal(withStagedPhoto({ name: "Soap" }, { intent: "replace", file }).stagedPhoto, file);
    assert.equal(withStagedPhoto({ name: "Soap" }, initialPhotoStage()).stagedPhoto, undefined);
    assert.equal(photoFailureDestination([]), null);
  });
});

describe("item list thumbnails", () => {
  const version = "cd".repeat(32);

  it("asks for the small photo and puts a real version on the address", () => {
    assert.equal(itemHasListPhoto({ photo: { width: 10 } }), true);
    assert.equal(itemHasListPhoto({ photo: null }), false);
    assert.equal(itemHasListPhoto(null), false);
    assert.equal(
      itemPhotoThumbPath(4, { width: 10, height: 10, bytes: 4, format: "webp", version }),
      `/api/items/4/photo/thumb?v=${version}`
    );
    assert.equal(
      itemPhotoThumbPath("4", { version: `  ${version.toUpperCase()}  ` }),
      `/api/items/4/photo/thumb?v=${version}`
    );
    assert.equal(itemPhotoThumbPath(4, { width: 10 }), "/api/items/4/photo/thumb");
    assert.equal(
      itemPhotoThumbPath(4, { version: "https://res.cloudinary.com/demo/secret" }),
      "/api/items/4/photo/thumb"
    );
    assert.equal(itemPhotoThumbPath(4, null), "");
    assert.equal(itemPhotoThumbPath("new", { version }), "");
    assert.equal(itemPhotoThumbPath(4, { version }).includes("/photo?"), false);
  });

  it("shows nothing when the small photo is missing or the row has no photo", () => {
    const photo = { version };
    assert.equal(itemThumbVisibility({ photo, previewUrl: "blob:thumb" }), "shown");
    assert.equal(itemThumbVisibility({ photo, previewUrl: "" }), "pending");
    assert.equal(itemThumbVisibility({ photo, previewUrl: "blob:thumb", failed: true }), "hidden");
    assert.equal(itemThumbVisibility({ photo: null, previewUrl: "blob:thumb" }), "hidden");
  });
});
