import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DRAFT_COMMENT,
  LEGAL_LAST_UPDATED,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
  legalPlainText,
} from "./legal.js";

const FORBIDDEN = [
  "soc 2",
  "iso 27001",
  "hipaa",
  "gdpr compliant",
  "certified",
  "certification",
];

function combined() {
  return `${legalPlainText(PRIVACY_SECTIONS)}\n${legalPlainText(TERMS_SECTIONS)}`.toLowerCase();
}

describe("legal drafts", () => {
  it("names the contact address, the draft marker, and the update date", () => {
    assert.equal(LEGAL_CONTACT_EMAIL, "uprightmrp@gmail.com");
    assert.equal(LEGAL_DRAFT_COMMENT, "DRAFT - review before launch");
    assert.equal(LEGAL_LAST_UPDATED, "November 8, 2026");
    assert.match(combined(), /uprightmrp@gmail.com/);
    assert.match(LEGAL_LAST_UPDATED, /November 8, 2026/);
  });

  it("matches how the product stores, bills, and supports a shop", () => {
    const text = combined();
    assert.match(text, /postgres/);
    assert.match(text, /neon/);
    assert.match(text, /netlify or vercel/);
    assert.match(text, /never store card numbers/);
    assert.match(text, /stripe/);
    assert.match(text, /gmail/);
    assert.match(text, /posthog/);
    assert.match(text, /masked/);
    assert.match(text, /session replay/);
    assert.match(text, /read-only view/);
    assert.match(text, /activity log/);
    assert.match(text, /7 days/);
    assert.match(text, /do not sell/);
  });

  it("does not claim a compliance certification", () => {
    const text = combined();
    for (const phrase of FORBIDDEN) {
      assert.equal(text.includes(phrase), false, phrase);
    }
  });
});
