import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ACTIVITY_LOG_UNAVAILABLE,
  activityQuery,
  activitySourceNotes,
  activityTypeLabel,
  auditQuery,
  customerActiveConfirm,
  formatInvoiceAmount,
  graceConfirm,
  graceDaysError,
  inviteConfirm,
  isGraceNotApplicable,
  memberActiveConfirm,
  passwordResetConfirm,
} from "./adminOps.js";

describe("admin feed queries", () => {
  it("sends selected activity types and paging", () => {
    assert.equal(
      activityQuery({ types: ["login", "email", "nope"], limit: 25, offset: 25 }),
      "type=login%2Cemail&limit=25&offset=25"
    );
    assert.equal(activityQuery({}), "limit=25&offset=0");
  });

  it("sends only the audit filters that were filled in", () => {
    assert.equal(
      auditQuery({
        clientId: "4",
        userId: "9",
        adminUserId: "2",
        action: " view_customer ",
        offset: 25,
      }),
      "clientId=4&userId=9&adminUserId=2&action=view_customer&limit=25&offset=25"
    );
    assert.equal(auditQuery({}), "limit=25&offset=0");
  });

  it("names an unavailable activity log and an invoice amount", () => {
    assert.deepEqual(activitySourceNotes({ admin_activity: "unavailable", email_log: "ok" }), [
      ACTIVITY_LOG_UNAVAILABLE,
    ]);
    assert.equal(activityTypeLabel("login_failed"), "Failed sign in");
    assert.equal(formatInvoiceAmount(2500, "usd"), "$25.00");
    assert.equal(formatInvoiceAmount(null), "—");
  });
});

describe("account action confirmation", () => {
  const user = { name: "Alex QA", email: "alex@example.com" };
  const shop = { name: "QA TEST Co" };

  it("names the person and what the email will do", () => {
    assert.match(passwordResetConfirm(user), /password reset email to Alex QA \(alex@example.com\)/);
    assert.match(passwordResetConfirm(user), /choose a new password/);
    assert.match(inviteConfirm(user), /welcome email to Alex QA \(alex@example.com\)/);
  });

  it("names deactivation separately from activation", () => {
    assert.match(memberActiveConfirm(user, false), /Deactivate Alex QA/);
    assert.match(memberActiveConfirm(user, false), /signed out/);
    assert.match(memberActiveConfirm(user, true), /Activate Alex QA/);
    assert.match(customerActiveConfirm(shop, false), /Deactivate QA TEST Co/);
    assert.match(customerActiveConfirm(shop, false), /lose access/);
    assert.match(customerActiveConfirm(shop, true), /Activate QA TEST Co/);
  });

  it("names the grace extension and rejects days outside 1 to 90", () => {
    assert.match(graceConfirm(shop, 14), /QA TEST Co by 14 days/);
    assert.match(graceConfirm(shop, 14), /past due/);
    assert.equal(graceDaysError(14), null);
    assert.ok(graceDaysError(0));
    assert.ok(graceDaysError(91));
    assert.ok(graceDaysError(1.5));
    const error = new Error("Grace can only be extended while the subscription is past due");
    error.status = 400;
    error.code = "GRACE_NOT_APPLICABLE";
    assert.equal(isGraceNotApplicable(error), true);
    assert.equal(isGraceNotApplicable(new Error("nope")), false);
  });
});
