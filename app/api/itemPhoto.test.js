import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const {
  DeleteItemPhoto,
  GetItemPhoto,
  UploadItemPhoto,
  setImpersonationReadOnlyHandler,
} = await import("./apiHandler.js");

const originalFetch = globalThis.fetch;

function ensureStorage() {
  if (globalThis.window?.localStorage) return;
  const store = new Map();
  const localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
  globalThis.localStorage = localStorage;
  globalThis.window = {
    localStorage,
    location: { pathname: "/items/4", replace() {} },
  };
}

after(() => {
  globalThis.fetch = originalFetch;
  setImpersonationReadOnlyHandler(null);
});

describe("item photo requests", () => {
  it("posts the image bytes and keeps only width, height, bytes, and format", async () => {
    ensureStorage();
    setStoredToken("token-1");
    const body = new Blob([Uint8Array.from([1, 2, 3, 4])], { type: "image/webp" });
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/items/4/photo");
      assert.equal(options.method, "POST");
      assert.equal(options.cache, "no-store");
      assert.equal(options.headers.Authorization, "Bearer token-1");
      assert.equal(options.headers["Content-Type"], "image/webp");
      assert.equal(options.body, body);
      assert.notEqual(typeof options.body, "string");
      return new Response(
        JSON.stringify({
          photo: {
            width: 800,
            height: 600,
            bytes: 4,
            format: "webp",
            url: "https://res.cloudinary.com/demo/secret",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const saved = await UploadItemPhoto(4, body);
    assert.deepEqual(saved.photo, { width: 800, height: 600, bytes: 4, format: "webp" });
    assert.equal(JSON.stringify(saved).includes("cloudinary"), false);
  });

  it("reads the private bytes and does not cache them", async () => {
    ensureStorage();
    setStoredToken("token-1");
    const bytes = Uint8Array.from([9, 8, 7]);
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/items/4/photo");
      assert.equal(options.method, undefined);
      assert.equal(options.cache, "no-store");
      assert.equal(options.headers.Authorization, "Bearer token-1");
      return new Response(bytes, {
        status: 200,
        headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store" },
      });
    };
    const blob = await GetItemPhoto(4);
    assert.equal(blob.type, "image/webp");
    assert.equal(blob.size, 3);
  });

  it("can abort a photo read that belongs to an item the user already left", async () => {
    ensureStorage();
    setStoredToken("token-1");
    const controller = new AbortController();
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.signal, controller.signal);
      assert.equal(options.cache, "no-store");
      return new Response(Uint8Array.from([1]), {
        status: 200,
        headers: { "Content-Type": "image/webp" },
      });
    };
    const blob = await GetItemPhoto(4, { signal: controller.signal });
    assert.equal(blob.size, 1);
  });

  it("clears the photo on delete", async () => {
    ensureStorage();
    setStoredToken("token-1");
    globalThis.fetch = async (url, options) => {
      assert.equal(options.method, "DELETE");
      assert.equal(String(url), "http://api.test/api/items/4/photo");
      return new Response(JSON.stringify({ photo: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const result = await DeleteItemPhoto(4);
    assert.deepEqual(result, { photo: null });
  });

  it("shows the server message for a bad type, a size limit, and a read-only view", async () => {
    ensureStorage();
    setStoredToken("view-token");
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          error: "Use a JPEG, PNG, WebP, or iPhone photo.",
          code: "PHOTO_INVALID",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    const jpeg = new Blob([Uint8Array.from([1])], { type: "image/jpeg" });
    await assert.rejects(UploadItemPhoto(4, jpeg), (error) => {
      assert.equal(error.message, "Use a JPEG, PNG, WebP, or iPhone photo.");
      assert.equal(error.code, "PHOTO_INVALID");
      return true;
    });

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          error: "Too many photo uploads. Try again in a few minutes.",
          code: "PHOTO_RATE_LIMITED",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    await assert.rejects(
      UploadItemPhoto(4, jpeg),
      /Too many photo uploads/
    );

    let toasted = 0;
    setImpersonationReadOnlyHandler(() => {
      toasted += 1;
    });
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          error: "Impersonation is read-only",
          code: "IMPERSONATION_READ_ONLY",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    await assert.rejects(UploadItemPhoto(4, jpeg), (error) => {
      assert.equal(error.code, "IMPERSONATION_READ_ONLY");
      return true;
    });
    assert.equal(toasted, 1);
  });

  it("does not send a file the browser has not turned into jpeg or webp", async () => {
    ensureStorage();
    const png = new Blob([Uint8Array.from([1])], { type: "image/png" });
    let called = 0;
    globalThis.fetch = async () => {
      called += 1;
      return new Response("no", { status: 500 });
    };
    await assert.rejects(UploadItemPhoto(4, png), /JPEG, PNG, WebP, or iPhone photo/);
    assert.equal(called, 0);
  });
});
