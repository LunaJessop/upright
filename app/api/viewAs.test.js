import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const {
  endAdminImpersonation,
  setImpersonationReadOnlyHandler,
  startAdminImpersonation,
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
    location: { pathname: "/admin", replace() {} },
  };
}

after(() => {
  globalThis.fetch = originalFetch;
  setImpersonationReadOnlyHandler(null);
});

describe("view-as-user requests", () => {
  it("posts confirm and a reason, then returns the view token", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(
        String(url),
        "http://api.test/api/admin/customers/4/users/9/impersonate"
      );
      assert.equal(options.headers.Authorization, "Bearer admin-token");
      assert.deepEqual(JSON.parse(options.body), {
        confirm: true,
        reason: "QA TEST support",
      });
      return new Response(JSON.stringify({ token: "view-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const data = await startAdminImpersonation(4, 9, "QA TEST support");
    assert.equal(data.token, "view-token");
  });

  it("ends the view with the view token and reads the admin token back", async () => {
    ensureStorage();
    setStoredToken("view-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/admin/impersonation/end");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer view-token");
      return new Response(JSON.stringify({ token: "admin-token", impersonating: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const data = await endAdminImpersonation();
    assert.equal(data.token, "admin-token");
  });

  it("toasts a friendly message when a write is refused as read-only", async () => {
    ensureStorage();
    setStoredToken("view-token");
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
    await assert.rejects(endAdminImpersonation(), (error) => {
      assert.equal(error.code, "IMPERSONATION_READ_ONLY");
      return true;
    });
    assert.equal(toasted, 1);
  });
});
