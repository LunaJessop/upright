import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  AUTH_TOKEN_KEY,
  handleUnauthorized,
  loginHref,
  pathAfterLogin,
  redirectToLogin,
  safeNextPath,
} from "./auth.js";

describe("safeNextPath", () => {
  it("allows same-site relative paths, including query and hash", () => {
    assert.equal(safeNextPath("/items"), "/items");
    assert.equal(safeNextPath("/settings/vendors"), "/settings/vendors");
    assert.equal(safeNextPath("/batches/42"), "/batches/42");
    assert.equal(safeNextPath("/items?tag=1"), "/items?tag=1");
    assert.equal(safeNextPath("/items#stock"), "/items#stock");
    assert.equal(safeNextPath("  /help  "), "/help");
  });

  it("rejects other domains and protocol-relative URLs", () => {
    assert.equal(safeNextPath("https://evil.com"), null);
    assert.equal(safeNextPath("http://evil.com/items"), null);
    assert.equal(safeNextPath("//evil.com"), null);
    assert.equal(safeNextPath("///evil.com"), null);
    assert.equal(safeNextPath("//evil.com/items"), null);
    assert.equal(safeNextPath("javascript:alert(1)"), null);
    assert.equal(safeNextPath(""), null);
    assert.equal(safeNextPath(null), null);
  });

  it("rejects backslash and encoded open redirects", () => {
    assert.equal(safeNextPath("/\\evil.com"), null);
    assert.equal(safeNextPath("/\\\\evil.com"), null);
    assert.equal(safeNextPath("/%2F%2Fevil.com"), null);
    assert.equal(safeNextPath("/%5Cevil.com"), null);
    assert.equal(safeNextPath("%2F%2Fevil.com"), null);
    assert.equal(safeNextPath("/%252F%252Fevil.com"), null);
    assert.equal(safeNextPath("/items\nSet-Cookie:x"), null);
  });

  it("rejects a return to the login page so sign-in cannot loop", () => {
    assert.equal(safeNextPath("/login"), null);
    assert.equal(safeNextPath("/login?next=/items"), null);
    assert.equal(safeNextPath("/login/extra"), null);
  });

  it("keeps query values that happen to contain a URL", () => {
    assert.equal(
      safeNextPath("/items?x=https://evil.com"),
      "/items?x=https://evil.com"
    );
  });
});

describe("pathAfterLogin", () => {
  const member = { has_read_access: true };

  it("returns the validated next path for someone with app access", () => {
    assert.equal(pathAfterLogin(member, "/batches"), "/batches");
    assert.equal(pathAfterLogin({ has_app_access: true }, "/admin"), "/admin");
  });

  it("falls back to items when next is missing or unsafe", () => {
    assert.equal(pathAfterLogin(member, null), "/items");
    assert.equal(pathAfterLogin(member, "https://evil.com"), "/items");
    assert.equal(pathAfterLogin(member, "//evil.com"), "/items");
  });

  it("sends accounts without access to plan selection", () => {
    assert.equal(pathAfterLogin({ has_read_access: false }, "/items"), "/register/plan");
    assert.equal(pathAfterLogin(null, "/items"), "/register/plan");
  });
});

describe("login redirect", () => {
  const assigned = [];
  const store = new Map();

  afterEach(() => {
    assigned.length = 0;
    store.clear();
    delete globalThis.window;
    delete globalThis.localStorage;
  });

  function installWindow(pathname, search = "") {
    globalThis.localStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
    };
    globalThis.window = {
      location: {
        pathname,
        search,
        assign: (href) => assigned.push(href),
      },
    };
  }

  it("builds a login url from the current path", () => {
    installWindow("/settings/phases", "?id=3");
    assert.equal(
      loginHref(),
      `/login?next=${encodeURIComponent("/settings/phases?id=3")}`
    );
  });

  it("round-trips a return path through the query string", () => {
    const href = loginHref("/items?tag=1");
    const next = new URL(href, "https://upright.invalid").searchParams.get("next");
    assert.equal(pathAfterLogin({ has_read_access: true }, next), "/items?tag=1");
  });

  it("sends a 401 to login and drops the stored token", () => {
    installWindow("/items", "");
    store.set(AUTH_TOKEN_KEY, "stale");
    const handled = handleUnauthorized({ status: 401 });
    assert.equal(handled, true);
    assert.equal(store.has(AUTH_TOKEN_KEY), false);
    assert.deepEqual(assigned, [`/login?next=${encodeURIComponent("/items")}`]);
  });

  it("does not redirect on other status codes", () => {
    installWindow("/items");
    store.set(AUTH_TOKEN_KEY, "ok");
    assert.equal(handleUnauthorized({ status: 403 }), false);
    assert.equal(store.get(AUTH_TOKEN_KEY), "ok");
    assert.deepEqual(assigned, []);
  });

  it("does not navigate again when already on the login page", () => {
    installWindow("/login", "?next=%2Fitems");
    redirectToLogin("/items");
    assert.deepEqual(assigned, []);
  });
});
