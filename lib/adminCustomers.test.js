import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canPageBack,
  canPageForward,
  customerListQuery,
  isForbiddenError,
  listWindow,
  memberSection,
  sectionShowing,
  subscriptionLabel,
} from "./adminCustomers.js";

describe("customerListQuery", () => {
  it("sends search, limit, and offset", () => {
    assert.equal(
      customerListQuery({ q: " QA TEST ", limit: 25, offset: 50 }),
      "q=QA+TEST&limit=25&offset=50"
    );
  });

  it("defaults an empty search and clamps bad paging numbers", () => {
    assert.equal(customerListQuery({}), "limit=25&offset=0");
    assert.equal(
      customerListQuery({ limit: 0, offset: -4, q: "  " }),
      "limit=25&offset=0"
    );
    assert.equal(customerListQuery({ limit: 500, offset: 10 }), "limit=100&offset=10");
  });
});

describe("list windows", () => {
  it("labels the current page and the next page", () => {
    assert.equal(listWindow({ offset: 0, count: 25, total: 30 }).label, "Showing 1–25 of 30");
    assert.equal(listWindow({ offset: 25, count: 5, total: 30 }).label, "Showing 26–30 of 30");
    assert.equal(listWindow({ offset: 0, count: 1, total: 1 }).label, "Showing 1 of 1");
    assert.equal(listWindow({ offset: 0, count: 0, total: 0 }).label, "Showing 0 of 0");
    assert.equal(canPageBack(0), false);
    assert.equal(canPageBack(25), true);
    assert.equal(canPageForward({ offset: 0, count: 25, total: 30 }), true);
    assert.equal(canPageForward({ offset: 25, count: 5, total: 30 }), false);
  });

  it("labels a detail section as showing X of total", () => {
    assert.equal(sectionShowing({ rows: [{ id: 1 }, { id: 2 }], total: 8 }), "Showing 2 of 8");
    assert.equal(sectionShowing({ rows: [], total: 0 }), "Showing 0 of 0");
    assert.equal(
      sectionShowing(memberSection({ members: [{ id: 1 }], user_count: 4 })),
      "Showing 1 of 4"
    );
  });
});

describe("admin access errors", () => {
  it("treats only a 403 as forbidden", () => {
    const forbidden = new Error("Platform admin required");
    forbidden.status = 403;
    assert.equal(isForbiddenError(forbidden), true);
    const missing = new Error("Customer not found");
    missing.status = 404;
    assert.equal(isForbiddenError(missing), false);
    assert.equal(isForbiddenError(new Error("nope")), false);
  });

  it("prints a subscription status without underscores", () => {
    assert.equal(subscriptionLabel("past_due"), "past due");
    assert.equal(subscriptionLabel(""), "—");
  });
});
