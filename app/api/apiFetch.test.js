import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

const store = new Map();
const location = {
  pathname: "/items",
  replaceCalls: 0,
  replace(next) {
    this.replaceCalls += 1;
    this.pathname = next;
  },
};

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
  location,
};

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const { getMe, setUnauthorizedHandler } = await import("./apiHandler.js");
const {
  clearLoginRedirect,
  getStoredToken,
  setStoredToken,
  shouldRedirectToLogin,
} = await import("../../lib/auth.js");

const originalFetch = globalThis.fetch;

after(() => {
  globalThis.fetch = originalFetch;
  setUnauthorizedHandler(null);
});

describe("apiFetch", () => {
  it("calls global fetch once and expires a 401 session once", async () => {
    clearLoginRedirect();
    location.pathname = "/items";
    location.replaceCalls = 0;
    setStoredToken("token-1");

    let expired = 0;
    setUnauthorizedHandler(() => {
      expired += 1;
    });

    let fetchCalls = 0;
    globalThis.fetch = async (url, options) => {
      fetchCalls += 1;
      assert.equal(String(url), "http://api.test/api/auth/me");
      assert.equal(options.headers.Authorization, "Bearer token-1");
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    await assert.rejects(getMe(), /Invalid or expired session/);
    assert.equal(fetchCalls, 1);
    assert.equal(expired, 1);
    assert.equal(getStoredToken(), null);
    assert.equal(shouldRedirectToLogin(), true);
    assert.equal(location.replaceCalls, 0);
  });

  it("does not redirect again when a 401 is already on /login", async () => {
    clearLoginRedirect();
    setUnauthorizedHandler(null);
    location.pathname = "/login";
    location.replaceCalls = 0;
    setStoredToken("stale-token");

    let fetchCalls = 0;
    globalThis.fetch = async () => {
      fetchCalls += 1;
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    await assert.rejects(getMe(), /Invalid or expired session/);
    assert.equal(fetchCalls, 1);
    assert.equal(location.replaceCalls, 0);
    assert.equal(location.pathname, "/login");
    assert.equal(getStoredToken(), null);
  });
});
