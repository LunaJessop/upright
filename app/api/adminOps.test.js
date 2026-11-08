import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const {
  extendAdminGrace,
  getAdminCustomerActivity,
  getAdminCustomerBilling,
  listAdminActivity,
  listAdminAudit,
  sendAdminPasswordReset,
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
});

describe("admin activity, audit, billing, and account actions", () => {
  it("loads filtered activity for one customer", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(
        String(url),
        "http://api.test/api/admin/customers/4/activity?type=login%2Cemail&limit=25&offset=0"
      );
      assert.equal(options.headers.Authorization, "Bearer admin-token");
      return new Response(
        JSON.stringify({
          events: [{ id: "activity:1", type: "login" }],
          page: { limit: 25, offset: 0, total: 1 },
          sources: { admin_activity: "ok", email_log: "ok" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const data = await getAdminCustomerActivity(4, { types: ["login", "email"] });
    assert.equal(data.events[0].type, "login");
  });

  it("loads the audit feed with its filters", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    globalThis.fetch = async (url) => {
      assert.equal(
        String(url),
        "http://api.test/api/admin/audit?clientId=4&action=view_customer&limit=25&offset=0"
      );
      return new Response(
        JSON.stringify({
          events: [],
          page: { limit: 25, offset: 0, total: 0 },
          sources: { admin_activity: "unavailable" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const data = await listAdminAudit({ clientId: "4", action: "view_customer" });
    assert.equal(data.sources.admin_activity, "unavailable");
  });

  it("loads billing and posts confirm:true on a password reset", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      if (String(url).endsWith("/billing")) {
        return new Response(
          JSON.stringify({
            billing: { subscription_status: "past_due" },
            stripe: { configured: true, invoices: [], payment_method: null, upcoming_invoice: null, error: null },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ user: { id: 9 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    await getAdminCustomerBilling(4);
    await sendAdminPasswordReset(4, 9);
    await listAdminActivity({ types: ["login"] });
    assert.equal(calls[0].url, "http://api.test/api/admin/customers/4/billing");
    assert.equal(calls[1].options.method, "POST");
    assert.deepEqual(JSON.parse(calls[1].options.body), { confirm: true });
    assert.equal(
      calls[1].url,
      "http://api.test/api/admin/customers/4/users/9/password-reset"
    );
  });

  it("keeps GRACE_NOT_APPLICABLE on the error", async () => {
    ensureStorage();
    setStoredToken("admin-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/admin/customers/4/grace");
      assert.deepEqual(JSON.parse(options.body), { confirm: true, days: 14 });
      return new Response(
        JSON.stringify({
          error: "Grace can only be extended while the subscription is past due",
          code: "GRACE_NOT_APPLICABLE",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    };
    await assert.rejects(extendAdminGrace(4, 14), (error) => {
      assert.equal(error.status, 400);
      assert.equal(error.code, "GRACE_NOT_APPLICABLE");
      assert.match(error.message, /past due/);
      return true;
    });
  });
});
