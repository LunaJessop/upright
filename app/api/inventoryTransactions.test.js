import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const {
  CreateItemInventoryTransaction,
  GetItemInventoryTransactions,
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
  globalThis.window = { localStorage, location: { pathname: "/items/9", replace() {} } };
}

after(() => {
  globalThis.fetch = originalFetch;
  setImpersonationReadOnlyHandler(null);
});

describe("item stock history requests", () => {
  it("loads one page, newest first, using the row id as the page marker", async () => {
    ensureStorage();
    setStoredToken("token-1");
    globalThis.fetch = async (url, options) => {
      assert.equal(
        String(url),
        "http://api.test/api/items/9/inventory/transactions?limit=20&before=15"
      );
      assert.equal(options.method, undefined);
      assert.equal(options.headers.Authorization, "Bearer token-1");
      return new Response(
        JSON.stringify({
          transactions: [{ id: 14 }],
          has_more: true,
          next_before: 14,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const page = await GetItemInventoryTransactions(9, { limit: 20, before: 15 });
    assert.equal(page.transactions[0].id, 14);
    assert.equal(page.has_more, true);
    assert.equal(page.next_before, 14);
  });

  it("posts the stock change with an empty price and note when they were left blank", async () => {
    ensureStorage();
    setStoredToken("token-1");
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/items/9/inventory/transactions");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer token-1");
      assert.equal(options.headers["Content-Type"], "application/json");
      assert.deepEqual(JSON.parse(options.body), {
        direction: "out",
        reason: "sold",
        quantity: 2,
        unit_price: null,
        note: null,
        occurred_on: "2026-11-26",
      });
      return new Response(
        JSON.stringify({
          inventory: { quantity: 8 },
          transaction: { id: 21 },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    };
    const saved = await CreateItemInventoryTransaction(9, {
      direction: "out",
      reason: "sold",
      quantity: 2,
      unit_price: null,
      note: null,
      occurred_on: "2026-11-26",
    });
    assert.equal(saved.inventory.quantity, 8);
    assert.equal(saved.transaction.id, 21);
  });

  it("surfaces a refused change and a read-only refusal", async () => {
    ensureStorage();
    setStoredToken("token-1");
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "That would take stock below zero." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    await assert.rejects(
      CreateItemInventoryTransaction(9, { direction: "out", reason: "sold", quantity: 9 }),
      (error) => {
        assert.equal(error.status, 400);
        assert.equal(error.message, "That would take stock below zero.");
        return true;
      }
    );

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ error: "Stock history isn't available yet." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    await assert.rejects(
      GetItemInventoryTransactions(9, { limit: 20 }),
      (error) => error.status === 503 && error.message === "Stock history isn't available yet."
    );

    let toasted = 0;
    setImpersonationReadOnlyHandler(() => {
      toasted += 1;
    });
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ error: "Impersonation is read-only", code: "IMPERSONATION_READ_ONLY" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    await assert.rejects(
      CreateItemInventoryTransaction(9, { direction: "in", reason: "found", quantity: 1 }),
      (error) => error.code === "IMPERSONATION_READ_ONLY"
    );
    assert.equal(toasted, 1);
  });
});
