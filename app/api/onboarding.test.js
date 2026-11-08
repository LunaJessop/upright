import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { setStoredToken } from "../../lib/auth.js";

process.env.NEXT_PUBLIC_API_URL = "http://api.test";

const { applyOnboardingTemplate, getOnboardingStatus, getOnboardingTemplates } = await import(
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
    location: { pathname: "/items", replace() {} },
  };
}

after(() => {
  globalThis.fetch = originalFetch;
});

describe("shop setup requests", () => {
  it("loads starter packs and the checklist", async () => {
    ensureStorage();
    setStoredToken("founder-token");
    const urls = [];
    globalThis.fetch = async (url) => {
      urls.push(String(url));
      if (String(url).endsWith("/templates")) {
        return new Response(JSON.stringify({ templates: [{ key: "soap" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({
          counts: { phases: 0 },
          checklist: [{ key: "phases", done: false }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const packs = await getOnboardingTemplates();
    const status = await getOnboardingStatus();
    assert.equal(packs.templates[0].key, "soap");
    assert.equal(status.checklist[0].done, false);
    assert.deepEqual(urls, [
      "http://api.test/api/onboarding/templates",
      "http://api.test/api/onboarding/status",
    ]);
  });

  it("applies a pack with the chosen phases and materials", async () => {
    ensureStorage();
    setStoredToken("founder-token");
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://api.test/api/onboarding/apply");
      assert.equal(options.headers.Authorization, "Bearer founder-token");
      assert.deepEqual(JSON.parse(options.body), {
        templateKey: "soap",
        include: { phases: true, items: false },
      });
      return new Response(
        JSON.stringify({
          template: { key: "soap", name: "Soap and cosmetics" },
          phases: { created: [{ name: "Melt oils" }], skipped: [] },
          items: { created: [], skipped: [] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };
    const data = await applyOnboardingTemplate({
      templateKey: "soap",
      include: { phases: true, items: false },
    });
    assert.equal(data.template.name, "Soap and cosmetics");
  });
});
