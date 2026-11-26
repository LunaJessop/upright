import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the catalog filter strip uses the grey token", () => {
  const page = readFileSync(new URL("./page.jsx", import.meta.url), "utf8");
  const catalogAt = page.indexOf(">Catalog<");
  assert.ok(catalogAt > 0);
  const strip = page.slice(catalogAt - 280, catalogAt);
  assert.match(strip, /bg-nv-grey/);
  assert.doesNotMatch(strip, /bg-nv-cyan/);
});
