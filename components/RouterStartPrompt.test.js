import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RouterStartPrompt, StartedFromNote } from "./RouterStartPrompt.jsx";

const noop = () => {};

test("an item that already has phases can replace them, add to the end, or cancel", () => {
  const html = renderToStaticMarkup(
    createElement(RouterStartPrompt, {
      routerName: "Cold process",
      onReplace: noop,
      onAppend: noop,
      onCancel: noop,
    })
  );
  assert.match(html, /Replace them with Cold process/);
  assert.match(html, />Replace</);
  assert.match(html, />Add to end</);
  assert.match(html, />Cancel</);
});

test("the started-from note names the router and stays hidden without one", () => {
  const html = renderToStaticMarkup(
    createElement(StartedFromNote, { name: "Cold process" })
  );
  assert.match(html, /Started from Cold process/);
  assert.equal(
    renderToStaticMarkup(createElement(StartedFromNote, { name: "" })),
    ""
  );
});
