import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const { getAdminCustomer, listAdminCustomers } = await import("./apiHandler.js");

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
});

describe("admin customer requests", () => {
  it("loads a page of customers", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(
        String(url),
        "http://api.test/api/admin/customers?q=QA+TEST&limit=25&offset=25"
      );
      assert.equal(options.headers.Authorization, "Bearer admin-token");
      return new Response(
        JSON.stringify({
          customers: [{ id: 2, name: "QA TEST Shop" }],
          page: { limit: 25, offset: 25, total: 30 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const data = await listAdminCustomers({ q: "QA TEST", limit: 25, offset: 25 });
    assert.equal(data.customers[0].name, "QA TEST Shop");
    assert.equal(data.page.total, 30);
  });

  it("keeps a 403 on the error so the page can explain it", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Platform admin required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });

    await assert.rejects(listAdminCustomers(), (error) => {
      assert.equal(error.status, 403);
      assert.match(error.message, /Platform admin required/);
      return true;
    });
  });

  it("loads one customer by id", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    globalThis.fetch = async (url) => {
      assert.equal(String(url), "http://api.test/api/admin/customers/12");
      return new Response(
        JSON.stringify({
          customer: { id: 12, name: "QA TEST Co", members: [] },
          items: { rows: [], total: 0, limit: 100 },
          vendors: { rows: [], total: 0, limit: 100 },
          phases: { rows: [], total: 0, limit: 100 },
          batches: { rows: [], total: 0, limit: 50 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const data = await getAdminCustomer(12);
    assert.equal(data.customer.name, "QA TEST Co");
    assert.equal(data.items.total, 0);
  });
});
