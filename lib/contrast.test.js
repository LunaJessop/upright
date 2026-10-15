import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { PALETTE, contrastRatio, onColor } from "./contrast.js";

describe("onColor", () => {
  it("picks the higher-contrast of black and white", () => {
    assert.equal(onColor("#7c3aed"), "#ffffff");
    assert.equal(onColor("#16717a"), "#ffffff");
    assert.equal(onColor("#b691f5"), "#000000");
    assert.equal(onColor("#7dafb5"), "#000000");
    assert.equal(onColor("#ebe1fc"), "#000000");
    assert.equal(onColor("#e4f1f2"), "#000000");
    assert.equal(onColor("#dc2626"), "#ffffff");
  });

  it("keeps every palette pair at 4.5:1 or better", () => {
    for (const [name, swatch] of Object.entries(PALETTE)) {
      assert.equal(onColor(swatch.hex), swatch.on, name);
      assert.ok(
        contrastRatio(swatch.on, swatch.hex) >= 4.5,
        `${name} ${contrastRatio(swatch.on, swatch.hex)}`
      );
    }
  });
});

describe("globals.css palette", () => {
  it("defines the same hexes as the contrast helper", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const expected = {
      "--nv-purple-dark": PALETTE.purpleDark.hex,
      "--nv-purple-muted": PALETTE.purpleMuted.hex,
      "--nv-purple-tint": PALETTE.purpleTint.hex,
      "--nv-green-dark": PALETTE.greenDark.hex,
      "--nv-green-muted": PALETTE.greenMuted.hex,
      "--nv-green-tint": PALETTE.greenTint.hex,
      "--nv-on-purple-dark": PALETTE.purpleDark.on,
      "--nv-on-green-dark": PALETTE.greenDark.on,
      "--nv-on-purple-muted": PALETTE.purpleMuted.on,
      "--nv-on-green-muted": PALETTE.greenMuted.on,
      "--nv-on-purple-tint": PALETTE.purpleTint.on,
      "--nv-on-green-tint": PALETTE.greenTint.on,
    };
    for (const [name, hex] of Object.entries(expected)) {
      assert.match(css, new RegExp(`${name}:\\s*${hex}`, "i"), name);
    }
  });
});
