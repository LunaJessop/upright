import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const { SaveBatchComponentProgress, setImpersonationReadOnlyHandler } = await import(
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
  globalThis.window = { localStorage, location: { pathname: "/batches/7", replace() {} } };
}

after(() => {
  globalThis.fetch = originalFetch;
  setImpersonationReadOnlyHandler(null);
});

describe("batch ingredient progress requests", () => {
  it("puts the entered amount and the batch step id, without a unit", async () => {
    ensureStorage();
    setStoredToken("token-1");
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/batches/7/components/11/progress");
      assert.equal(options.method, "PUT");
      assert.equal(options.headers.Authorization, "Bearer token-1");
      assert.deepEqual(JSON.parse(options.body), {
        batch_phase_id: 15,
        quantity_entered: "1.5",
      });
      assert.equal(options.body.includes("unit"), false);
      return new Response(
        JSON.stringify({
          batch_component_id: 11,
          batch_phase_id: 15,
          quantity_entered: "1.5",
          quantity_allocated: "4",
          unit_of_measure: "oz",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const saved = await SaveBatchComponentProgress(7, 11, {
      batchPhaseId: 15,
      quantityEntered: "1.5",
    });
    assert.equal(saved.quantity_entered, "1.5");
    assert.equal(saved.quantity_allocated, "4");
  });

  it("sends null for an ingredient that is not on one step", async () => {
    ensureStorage();
    setStoredToken("token-1");
    globalThis.fetch = async (_url, options) => {
      assert.equal(JSON.parse(options.body).batch_phase_id, null);
      return new Response(
        JSON.stringify({
          batch_component_id: 12,
          batch_phase_id: null,
          quantity_entered: "0",
          quantity_allocated: "2",
          unit_of_measure: "oz",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const saved = await SaveBatchComponentProgress(7, 12, {
      batchPhaseId: null,
      quantityEntered: "0",
    });
    assert.equal(saved.batch_phase_id, null);
  });

  it("surfaces the not-set-up error and a read-only refusal", async () => {
    ensureStorage();
    setStoredToken("view-token");
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          error: "Ingredient progress is not set up yet.",
          code: "PROGRESS_UNAVAILABLE",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    await assert.rejects(
      SaveBatchComponentProgress(7, 11, { batchPhaseId: 15, quantityEntered: "1" }),
      (error) => {
        assert.equal(error.status, 503);
        assert.equal(error.code, "PROGRESS_UNAVAILABLE");
        assert.equal(error.message, "Ingredient progress is not set up yet.");
        return true;
      }
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
      SaveBatchComponentProgress(7, 11, { batchPhaseId: 15, quantityEntered: "1" }),
      (error) => error.code === "IMPERSONATION_READ_ONLY"
    );
    assert.equal(toasted, 1);
  });
});
