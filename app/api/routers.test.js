import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const { CreateRouter, DeleteRouter, GetRouters, UpdateRouter } = await import(
  "./apiHandler.js"
);

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
    location: { pathname: "/settings/routers", replace() {} },
  };
}

after(() => {
  globalThis.fetch = originalFetch;
});

describe("router requests", () => {
  it("loads the saved routers", async () => {
    ensureStorage();
    setStoredToken("founder-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/routers");
      assert.equal(options.headers.Authorization, "Bearer founder-token");
      return new Response(JSON.stringify([{ id: 4, name: "Cold process", phases: [] }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const rows = await GetRouters();
    assert.equal(rows[0].name, "Cold process");
  });

  it("creates and updates a router with its phases", async () => {
    ensureStorage();
    setStoredToken("founder-token");
    const bodies = [];
    globalThis.fetch = async (url, options) => {
      bodies.push({ url: String(url), method: options.method, body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ id: 4, name: "Cold process" }), {
        status: options.method === "POST" ? 201 : 200,
        headers: { "Content-Type": "application/json" },
      });
    };
    const payload = {
      name: "Cold process",
      description: null,
      phases: [{ sequence: 1, name: "Melt", description: null, estimated_minutes: null }],
    };
    await CreateRouter(payload);
    await UpdateRouter(4, payload);
    assert.deepEqual(bodies, [
      { url: "http://api.test/api/routers", method: "POST", body: payload },
      { url: "http://api.test/api/routers/4", method: "PUT", body: payload },
    ]);
  });

  it("deletes a router when the response has no body", async () => {
    ensureStorage();
    setStoredToken("founder-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/routers/4");
      assert.equal(options.method, "DELETE");
      return new Response(null, { status: 204 });
    };
    assert.equal(await DeleteRouter(4), true);
  });

  it("surfaces a duplicate name and an unavailable list", async () => {
    ensureStorage();
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "A router with that name already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    await assert.rejects(
      CreateRouter({ name: "Cold process", phases: [] }),
      /A router with that name already exists/
    );

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Routers aren't available yet." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    await assert.rejects(GetRouters(), /Routers aren't available yet/);
  });
});
