import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ItemPhotoThumbView from "./ItemPhotoThumbView.jsx";

function html(props) {
  return renderToStaticMarkup(createElement(ItemPhotoThumbView, props));
}

test("a list thumbnail is a small covered photo", () => {
  const markup = html({ previewUrl: "blob:thumb" });
  assert.match(markup, /<img/);
  assert.match(markup, /src="blob:thumb"/);
  assert.match(markup, /alt=""/);
  assert.match(markup, /width="40"/);
  assert.match(markup, /height="40"/);
  assert.match(markup, /loading="lazy"/);
  assert.match(markup, /decoding="async"/);
  assert.match(markup, /object-cover/);
  assert.match(markup, /h-10/);
  assert.match(markup, /w-10/);
  assert.match(markup, /border-brutal-xs/);
  assert.match(markup, /border-black/);
  assert.doesNotMatch(markup, /could not be loaded/);
  assert.doesNotMatch(markup, /Loading photo/);
  assert.doesNotMatch(markup, /role="alert"/);
});

test("a missing thumbnail shows nothing", () => {
  assert.equal(html({ previewUrl: "" }), "");
  assert.equal(html({}), "");
});
