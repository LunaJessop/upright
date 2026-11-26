import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HelpIcon from "./HelpIcon.jsx";
import { HELP_LABELS, HELP_TEXT } from "../lib/helpText.js";

function markup(props) {
  return renderToStaticMarkup(createElement(HelpIcon, props));
}

test("the help control is a button with a described note and no browser title", () => {
  const html = markup({ text: HELP_TEXT.bom, label: HELP_LABELS.bom });
  const described = html.match(/aria-describedby="([^"]+)"/);
  assert.ok(described, html);
  assert.match(html, new RegExp(`id="${described[1]}"`));
  assert.match(html, /<button[^>]*type="button"/);
  assert.match(html, /aria-label="Help: BOM"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /role="tooltip"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /BOM \(bill of materials\) is the recipe list/);
  assert.match(html, />\?</);
  assert.doesNotMatch(html, /\stitle=/);
});

test("an empty note renders nothing", () => {
  assert.equal(markup({ text: "", label: "Help: BOM" }), "");
});

test("the closed note stays available to a screen reader", () => {
  const html = markup({
    text: HELP_TEXT.makeVsBuy,
    label: HELP_LABELS.makeVsBuy,
  });
  assert.match(html, /sr-only/);
  assert.match(html, /Buy means you purchase this item/);
  assert.match(html, /aria-describedby="/);
});
