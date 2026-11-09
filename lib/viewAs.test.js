import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canViewAsMember,
  clearViewAsStash,
  isBlockedWhileViewing,
  readViewAsReturn,
  stashAdminSession,
  viewAsBannerText,
  viewAsConfirm,
  viewAsExpired,
  viewAsReasonError,
} from "./viewAs.js";

describe("view as member", () => {
  const admin = { email: "alex@example.com", is_platform_admin: true };

  it("hides the button for a platform admin and offers it for everyone else", () => {
    assert.equal(
      canViewAsMember({ id: 1, email: "Alex@example.com" }, admin),
      false
    );
    assert.equal(
      canViewAsMember({ id: 2, email: "pat@example.com", is_platform_admin: true }, admin),
      false
    );
    assert.equal(canViewAsMember({ id: 3, email: "pat@example.com" }, admin), true);
  });

  it("requires a short reason and names what the view will do", () => {
    assert.equal(viewAsReasonError("  "), "A reason is required.");
    assert.equal(viewAsReasonError("QA TEST support"), null);
    assert.match(viewAsReasonError("x".repeat(501)), /500/);
    assert.match(viewAsConfirm({ name: "Pat QA", email: "pat@example.com" }), /Pat QA \(pat@example.com\)/);
    assert.match(viewAsConfirm({ name: "Pat QA", email: "pat@example.com" }), /cannot change anything/);
  });

  it("banners the viewed email and a read-only end time", () => {
    const now = new Date("2026-11-08T20:00:00");
    const ends = new Date("2026-11-08T20:30:00");
    const text = viewAsBannerText({
      email: "pat@example.com",
      expiresAt: ends.toISOString(),
      now,
    });
    assert.match(text, /^Viewing as pat@example.com · read-only · ends /);
    assert.equal(viewAsExpired(ends.toISOString(), now.getTime()), false);
    assert.equal(viewAsExpired(now.toISOString(), now.getTime() + 1), true);
  });

  it("keeps the admin token in sessionStorage only", () => {
    const session = new Map();
    const local = new Map();
    globalThis.sessionStorage = {
      getItem: (key) => (session.has(key) ? session.get(key) : null),
      setItem: (key, value) => session.set(key, String(value)),
      removeItem: (key) => session.delete(key),
    };
    globalThis.localStorage = {
      getItem: (key) => (local.has(key) ? local.get(key) : null),
      setItem: (key, value) => local.set(key, String(value)),
      removeItem: (key) => local.delete(key),
    };
    stashAdminSession("admin-token", "/admin/customers/4");
    assert.equal(session.get("upright_admin_token"), "admin-token");
    assert.equal(readViewAsReturn(), "/admin/customers/4");
    assert.equal(local.size, 0);
    clearViewAsStash();
    assert.equal(session.has("upright_admin_token"), false);
  });

  it("blocks write controls and leaves search and navigation alone", () => {
    assert.equal(isBlockedWhileViewing({ tag: "a", href: "/items/new-item", text: "Add item" }), true);
    assert.equal(isBlockedWhileViewing({ tag: "a", href: "/items/4", text: "QA TEST Serum" }), false);
    assert.equal(isBlockedWhileViewing({ tag: "button", text: "Save" }), true);
    assert.equal(isBlockedWhileViewing({ tag: "button", text: "Export CSV" }), false);
    assert.equal(isBlockedWhileViewing({ tag: "input", type: "search" }), false);
    assert.equal(isBlockedWhileViewing({ tag: "input", type: "text" }), true);
    assert.equal(isBlockedWhileViewing({ tag: "input", type: "file" }), true);
    assert.equal(isBlockedWhileViewing({ tag: "button", text: "Remove photo" }), true);
    assert.equal(isBlockedWhileViewing({ tag: "button", text: "Add photo" }), true);
    assert.equal(isBlockedWhileViewing({ tag: "button", text: "Stop", allow: true }), false);
  });
});
