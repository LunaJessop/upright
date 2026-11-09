import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ItemPhotoView from "./ItemPhotoView.jsx";

function html(props) {
  return renderToStaticMarkup(createElement(ItemPhotoView, props));
}

test("a saved item without a photo offers an accessible add control", () => {
  const markup = html({ itemName: "Soap", canWrite: true });
  assert.match(markup, /No photo yet\./);
  assert.match(markup, /aria-label="Add photo"/);
  assert.match(markup, /image\/heic/);
  assert.doesNotMatch(markup, /Remove photo/);
  assert.doesNotMatch(markup, /<img/);
});

test("a photo shows its name, a loading state, and remove", () => {
  const loading = html({ itemName: "Soap", hasPhoto: true, canWrite: true, status: "Loading photo…" });
  assert.match(loading, /Loading photo…/);
  assert.match(loading, /role="status"/);
  assert.match(loading, /aria-label="Replace photo"/);
  assert.match(loading, />Remove photo</);

  const shown = html({
    itemName: "Soap",
    hasPhoto: true,
    canWrite: true,
    previewUrl: "blob:photo",
  });
  assert.match(shown, /<img[^>]*alt="Soap photo"/);
  assert.match(shown, /src="blob:photo"/);
});

test("remove asks on the page and an error stays visible", () => {
  const markup = html({
    itemName: "Soap",
    hasPhoto: true,
    canWrite: true,
    confirmingRemove: true,
    error: "This photo is too large to store. Try a smaller one.",
  });
  assert.match(markup, /Remove the photo from Soap\? The item itself stays\./);
  assert.match(markup, />Go back</);
  assert.match(markup, />Remove photo</);
  assert.match(markup, /role="alert"/);
  assert.match(markup, /too large to store/);
  assert.doesNotMatch(markup, /type="file"/);
});

test("read-only and unsaved items cannot upload", () => {
  const readOnly = html({ itemName: "Soap", hasPhoto: true, canWrite: false, previewUrl: "blob:photo" });
  assert.match(readOnly, /alt="Soap photo"/);
  assert.doesNotMatch(readOnly, /type="file"/);
  assert.doesNotMatch(readOnly, /Remove photo/);

  const unsaved = html({ savedOnly: true, canWrite: true });
  assert.match(unsaved, /after this item is saved/);
  assert.doesNotMatch(unsaved, /type="file"/);
});
