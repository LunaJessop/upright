import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChangelogList from "./ChangelogList.jsx";

test("what's new reads as a document, not a stack of cards", () => {
  const html = renderToStaticMarkup(createElement(ChangelogList));

  assert.match(html, /<h1[^>]*>v0\.5 · November 8, 2026<\/h1>/);
  assert.match(html, /<h2[^>]*>A shop can start without a spreadsheet<\/h2>/);
  assert.match(
    html,
    /<p[^>]*>Pick what you make and start with phases and materials\. It takes a few minutes, and there is no spreadsheet\.<\/p>/
  );
  assert.match(html, /<p[^>]*>Security and reliability improvements\.<\/p>/);
  assert.doesNotMatch(html, /Upcoming/);
  assert.doesNotMatch(html, /border-brutal|shadow-brutal|bg-nv-purple-dark|bg-nv-green-dark|bg-nv-paper/);
});
